import { useEffect, useState } from "react";
import API from "../services/api";
import { jwtDecode } from "jwt-decode";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [role, setRole] = useState("USER");

  const token = localStorage.getItem("token");
  const itemsPerPage = 5;

  useEffect(() => {
    if (token) {
      const decoded = jwtDecode(token);
      setRole(decoded.role || "USER");
      fetchTasks();
    }
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
      toast.error("Unauthorized access");
    }
  };

  const applyFilters = () => {
    let temp = [...tasks];

    if (filter !== "ALL") {
      temp = temp.filter((t) => t.status === filter);
    }

    if (search) {
      temp = temp.filter((t) =>
        t.title.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFilteredTasks(temp);
    setPage(1);
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
        user: { id: userId },
      });

      setTitle("");
      setDescription("");
      toast.success("Task created");
      fetchTasks();
    } catch {
      toast.error("Task creation failed");
    }
  };

  const toggleStatus = async (task) => {
    const updatedStatus = task.status === "TODO" ? "DONE" : "TODO";

    await API.put(`/api/tasks/${task.id}`, {
      ...task,
      status: updatedStatus,
    });

    toast.success("Task updated");
    fetchTasks();
  };

  const deleteTask = async (id) => {
    await API.delete(`/api/tasks/${id}`);
    toast.success("Task deleted");
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

  const COLORS = ["#22c55e", "#f59e0b"];

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-white">

      {/* SIDEBAR */}
      <div className="w-64 bg-[#111827] p-6 hidden md:block">
        <h2 className="text-2xl font-bold mb-8">TASKFLOW</h2>
        <p className="text-gray-400 text-sm mb-4">Role: {role}</p>
        <button
          onClick={logout}
          className="bg-red-600 w-full py-2 rounded-md text-sm"
        >
          Logout
        </button>
      </div>

      {/* CONTENT */}
      <div className="flex-1 p-6 md:p-10">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-semibold">
            Enterprise Dashboard
          </h1>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[
            { label: "Total Tasks", value: tasks.length },
            { label: "Completed", value: chartData[0].value },
            { label: "Pending", value: chartData[1].value },
          ].map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-[#1e293b] p-6 rounded-xl shadow-md"
            >
              <h3 className="text-gray-400">{card.label}</h3>
              <p className="text-3xl font-bold mt-2">{card.value}</p>
            </motion.div>
          ))}
        </div>

        {/* CREATE TASK */}
        {role === "ADMIN" && (
          <div className="bg-[#1e293b] p-6 rounded-xl mb-10">
            <h2 className="mb-4 font-semibold">Create Task</h2>
            <div className="flex flex-col md:flex-row gap-4">
              <input
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-[#334155] px-4 py-2 rounded-md flex-1"
              />
              <input
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-[#334155] px-4 py-2 rounded-md flex-1"
              />
              <button
                onClick={createTask}
                className="bg-indigo-600 px-6 py-2 rounded-md"
              >
                Add
              </button>
            </div>
          </div>
        )}

        {/* ANALYTICS */}
        <div className="bg-[#1e293b] p-6 rounded-xl mb-10">
          <h2 className="mb-4 font-semibold">Analytics</h2>
          <div style={{ width: "100%", height: 250 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={chartData} dataKey="value" outerRadius={90}>
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-[#1e293b] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#334155] text-sm text-gray-300">
              <tr>
                <th className="p-4">Title</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {paginatedTasks.map(task => (
                <tr key={task.id} className="border-t border-gray-700">
                  <td className="p-4">{task.title}</td>

                  <td>
                    <span className={`px-3 py-1 text-xs rounded-full ${
                      task.status === "DONE"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-yellow-500/20 text-yellow-400"
                    }`}>
                      {task.status}
                    </span>
                  </td>

                  <td className="space-x-3">
                    <button
                      onClick={() => toggleStatus(task)}
                      className="text-indigo-400 text-sm"
                    >
                      Toggle
                    </button>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-red-400 text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;