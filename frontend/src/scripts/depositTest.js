const { ethers } = require("ethers");
require('dotenv').config();


// ABI of the NativeTokenDistributor contract
const ABI = [
  "function deposit() external payable",
  "function withdraw(uint256 amount) external",
  "function getBalance() external view returns (uint256)",
  "function distribute(address[] recipients, uint256[] amounts) external"
];


(async () => {
  const RPC_URL = process.env.RPC_URL;
  const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
  const PRIVATE_KEY = process.env.PRIVATE_KEY;

  if (!RPC_URL || !CONTRACT_ADDRESS || !PRIVATE_KEY) {
    throw new Error("Missing required environment variables");
  }
  
  try {
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    console.log("Wallet done")
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

    console.log("Connected to contract:");
    console.log(CONTRACT_ADDRESS);

    // Deposit tokens
    console.log("Depositing tokens...");
    const depositTx = await contract.deposit({ value: ethers.utils.parseEther("0.01") });
    await depositTx.wait();
    console.log("Deposit successful:");
    console.log(depositTx.hash);

    // Fetch contract balance
    console.log("Fetching contract balance...");
    let balance = await contract.getBalance();
    console.log("Contract balance:");
    console.log(ethers.utils.formatEther(balance) + " AVAX");

    // Withdraw tokens
    console.log("Withdrawing tokens...");
    const withdrawTx = await contract.withdraw(ethers.utils.parseEther("0.005"));
    await withdrawTx.wait();
    console.log("Withdrawal successful:");
    console.log(withdrawTx.hash);

    // Final contract balance
    console.log("Fetching final contract balance...");
    balance = await contract.getBalance();
    console.log("Final contract balance:");
    console.log(ethers.utils.formatEther(balance) + " AVAX");
  } catch (error) {
    console.error("Error:");
    console.error(error);
  }
})();