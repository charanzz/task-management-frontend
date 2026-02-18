import { useEffect, useState } from "react"
import API from "../services/api"
import { jwtDecode } from "jwt-decode"

function Dashboard() {

  const [tasks, setTasks] = useState([])
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [stats, setStats] = useState(null)

  const token = localStorage.getItem("token")

  useEffect(() => {
    if (token) {
      fetchTasks()
    }
  }, [])

  const fetchTasks = async () => {
    try {
      const decoded = jwtDecode(token)
      const email = decoded.sub

      const userRes = await API.get(`/api/users/${email}`)
      const userId = userRes.data.id

      const taskRes = await API.get(`/api/tasks/user/${userId}`)
      setTasks(taskRes.data.content || taskRes.data)

    } catch (err) {
      console.log(err)
      alert("Unauthorized")
    }
  }

  const createTask = async () => {
    try {
      const decoded = jwtDecode(token)
      const email = decoded.sub

      const userRes = await API.get(`/api/users/${email}`)
      const userId = userRes.data.id

      await API.post("/api/tasks", {
        title,
        description,
        status: "TODO",
        priority: "MEDIUM",
        user: { id: userId }
      })

      setTitle("")
      setDescription("")
      fetchTasks()

    } catch (err) {
      alert("Task creation failed")
    }
  }

  const toggleStatus = async (task) => {
    const updatedStatus = task.status === "TODO" ? "DONE" : "TODO"

    await API.put(`/api/tasks/${task.id}`, {
      ...task,
      status: updatedStatus
    })

    fetchTasks()
  }

  const deleteTask = async (id) => {
    await API.delete(`/api/tasks/${id}`)
    fetchTasks()
  }

  const logout = () => {
    localStorage.removeItem("token")
    window.location.href = "/"
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>Discipline Dashboard 🚀</h2>
      <button onClick={logout}>Logout</button>

      <hr />

      <h3>Create Task</h3>

      <input
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <br /><br />

      <input
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <br /><br />

      <button onClick={createTask}>Create Task</button>

      <hr />

      {stats && (
        <>
          <h3>📊 Productivity Stats</h3>
          <p>Total Tasks: {stats.totalTasks}</p>
          <p>Completed: {stats.completedTasks}</p>
          <p>Completion Rate: {stats.completionRate}%</p>
          <hr />
        </>
      )}

      <h3>Your Tasks</h3>

      <ul>
        {tasks.map(task => (
          <li key={task.id}>
            <strong>{task.title}</strong> — {task.status}
            <button onClick={() => toggleStatus(task)}>
              Toggle Status
            </button>
            <button onClick={() => deleteTask(task.id)}>
              Delete
            </button>
          </li>
        ))}
      </ul>

    </div>
  )
}

export default Dashboard
