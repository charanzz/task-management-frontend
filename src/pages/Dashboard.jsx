import { useEffect, useState } from "react";
import API from "../services/api";
import { jwtDecode } from "jwt-decode";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer
} from "recharts";

function Dashboard() {

  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const token = localStorage.getItem("token");
  const itemsPerPage = 5;

  useEffect(() => {
    if (token) fetchTasks();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [tasks, filter, search]);

  const fetchTasks = async () => {
    try {
      const decoded = jwtDecode(token);
      const email = decoded.sub;

      const userRes = await API.get(`/api/users/${email}`);
      const userId = userRes.data.id;

      const taskRes = await API.get(`/api/tasks/user/${userId}`);
      const data = taskRes.data.content || taskRes.data;
      setTasks(data);

    } catch {
      alert("Unauthorized");
    }
  };

  const applyFilters = () => {
    let temp = [...tasks];

    if (filter !== "ALL") {
      temp = temp.filter(t => t.status === filter);
    }

    if (search) {
      temp = temp.filter(t =>
        t.title.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFilteredTasks(temp);
  };

  const createTask = async () => {
    try {
      const decoded = jwtDecode(token);
      const email = decoded.sub;

      const userRes = await API.get(`/api/users/${email}`);
      const userId = userRes.data.id;

      await API.post("/api/tasks", {
        title,
        description,
        status: "TODO",
        priority: "MEDIUM",
        user: { id: userId }
      });

      setTitle("");
      setDescription("");
      fetchTasks();

    } catch {
      alert("Task creation failed");
    }
  };

  const toggleStatus = async (task) => {
    const updatedStatus = task.status === "TODO" ? "DONE" : "TODO";

    await API.put(`/api/tasks/${task.id}`, {
      ...task,
      status: updatedStatus
    });

    fetchTasks();
  };

  const deleteTask = async (id) => {
    await API.delete(`/api/tasks/${id}`);
    fetchTasks();
  };

  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  const paginatedTasks = filteredTasks.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const chartData = [
    { name: "Completed", value: tasks.filter(t => t.status === "DONE").length },
    { name: "Pending", value: tasks.filter(t => t.status === "TODO").length }
  ];

  const COLORS = ["#16a34a", "#f59e0b"];

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Top Nav */}
      <div className="bg-white shadow-sm border px-8 py-4 flex justify-between">
        <h1 className="text-xl font-semibold">Enterprise Task Dashboard</h1>

        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">Admin</div>
          <button
            onClick={logout}
            className="bg-red-600 text-white px-4 py-1 rounded-md"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="p-8">

        {/* Create Task */}
        <div className="bg-white p-6 rounded-md border mb-8">
          <h2 className="font-semibold mb-4">Create Task</h2>

          <div className="flex gap-4">
            <input
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border px-3 py-2 rounded-md flex-1"
            />
            <input
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border px-3 py-2 rounded-md flex-1"
            />
            <button
              onClick={createTask}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md"
            >
              Add
            </button>
          </div>
        </div>

        {/* Analytics */}
        <div className="bg-white p-6 rounded-md border mb-8">
          <h2 className="font-semibold mb-4">Analytics</h2>

          <div style={{ width: "100%", height: 250 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  outerRadius={80}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Filters */}
        <div className="flex justify-between mb-4">
          <div className="flex gap-3">
            {["ALL", "TODO", "DONE"].map(type => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-4 py-1 rounded-md ${
                  filter === type
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-200"
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <input
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border px-3 py-1 rounded-md"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-md border overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-sm text-gray-600">
              <tr>
                <th className="p-3">Title</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTasks.map(task => (
                <tr key={task.id} className="border-t">
                  <td className="p-3">{task.title}</td>
                  <td>
                    <span className={`text-xs px-3 py-1 rounded-full ${
                      task.status === "DONE"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {task.status}
                    </span>
                  </td>
                  <td className="space-x-3">
                    <button
                      onClick={() => toggleStatus(task)}
                      className="text-blue-600 text-sm"
                    >
                      Toggle
                    </button>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-red-600 text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-end mt-4 gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1 bg-gray-200 rounded-md"
          >
            Prev
          </button>
          <button
            disabled={page * itemsPerPage >= filteredTasks.length}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1 bg-gray-200 rounded-md"
          >
            Next
          </button>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;