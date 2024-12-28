import { useState, useEffect } from "react";
import Web3 from "web3";
import ToDoListABI from "./ToDoListABI.json"; // Replace with your ABI JSON file
import "./App.css";

const App = () => {
  const [contract, setContract] = useState(null);
  const [accounts, setAccounts] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [taskDescription, setTaskDescription] = useState("");

  const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS; // Your contract address

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        setIsConnecting(true);
        const web3Instance = new Web3(window.ethereum);
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const accounts = await web3Instance.eth.getAccounts();
        setAccounts(accounts);

        const contractInstance = new web3Instance.eth.Contract(
          ToDoListABI,
          contractAddress
        );
        setContract(contractInstance);

        // Fetch initial tasks
        fetchTasks(contractInstance);
      } catch (error) {
        console.error("Error connecting to MetaMask", error);
      } finally {
        setIsConnecting(false);
      }
    } else {
      alert("MetaMask is not installed");
    }
  };

  const disconnectWallet = () => {
    setContract(null);
    setAccounts(null);
    setTasks([]);
  };

  const fetchTasks = async (contractInstance) => {
    if (contractInstance) {
      try {
        const tasksData = await contractInstance.methods.getTasks().call();
        setTasks(tasksData);
      } catch (error) {
        console.error("Error fetching tasks", error);
      }
    }
  };

  const addTask = async () => {
    if (contract && accounts && taskDescription) {
      try {
        await contract.methods
          .addTask(taskDescription)
          .send({ from: accounts[0] });
        setTaskDescription(""); // Reset input field
        fetchTasks(contract); // Refresh tasks list
      } catch (error) {
        console.error("Error adding task", error);
      }
    }
  };

  const completeTask = async (taskId) => {
    if (contract && accounts) {
      try {
        await contract.methods.completeTask(taskId).send({ from: accounts[0] });
        fetchTasks(contract); // Refresh tasks list
      } catch (error) {
        console.error("Error completing task", error);
      }
    }
  };

  const deleteTask = async (taskId) => {
    if (contract && accounts) {
      try {
        await contract.methods.deleteTask(taskId).send({ from: accounts[0] });
        fetchTasks(contract); // Refresh tasks list
      } catch (error) {
        console.error("Error deleting task", error);
      }
    }
  };

  useEffect(() => {
    if (contract) {
      fetchTasks(contract);
    }
  }, [contract]);

  return (
    <div className="App">
      <h1>To-Do List DApp</h1>
      {accounts ? (
        <>
          <p>Connected Account: {accounts[0]}</p>
          <div>
            <input
              type="text"
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              placeholder="Enter a new task"
            />
            <button onClick={addTask}>Add Task</button>
          </div>
          <ul>
            {tasks.map((task) => (
              <li key={task.id}>
                <span style={{ textDecoration: task.completed ? "line-through" : "" }}>
                  {task.description}
                </span>
                <button onClick={() => completeTask(task.id)}>Complete</button>
                <button onClick={() => deleteTask(task.id)}>Delete</button>
              </li>
            ))}
          </ul>
          <button onClick={disconnectWallet}>Disconnect Wallet</button>
        </>
      ) : (
        <button onClick={connectWallet} disabled={isConnecting}>
          {isConnecting ? "Connecting..." : "Connect Wallet"}
        </button>
      )}
    </div>
  );
};

export default App;