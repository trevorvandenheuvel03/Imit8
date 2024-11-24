const { ethers } = require("ethers");
require('dotenv').config();


const ABI = [
  "function deposit() external payable",
  "function withdraw(uint256 amount) external",
  "function getBalance() external view returns (uint256)",
  "function distribute(address[] recipients, uint256[] amounts) external"
];

async function sendAVAX(recipient, amount) {
  const RPC_URL = process.env.RPC_URL;
  const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
  const PRIVATE_KEY = process.env.PRIVATE_KEY;

  if (!RPC_URL || !CONTRACT_ADDRESS || !PRIVATE_KEY) {
    throw new Error("Missing required environment variables");
  }
  
  try {
    console.log("Connecting to provider...");
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);

    console.log("Creating wallet...");
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    console.log("Connecting to contract...");
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);
    console.log(`Connected to contract: ${CONTRACT_ADDRESS}`);

    // Format inputs for the distribute function
    const recipients = [recipient];
    const amounts = [ethers.utils.parseEther(amount)];

    console.log(`Preparing to send ${amount} AVAX to recipient: ${recipient}...`);

    // Call the distribute function
    const tx = await contract.distribute(recipients, amounts);
    console.log(`Transaction sent. Waiting for confirmation...`);
    const receipt = await tx.wait();
    console.log(`Distribution successful: ${receipt.transactionHash}`);

    // Fetch updated contract balance
    console.log("Fetching updated contract balance...");
    const balance = await contract.getBalance();
    console.log(`Updated contract balance: ${ethers.utils.formatEther(balance)} AVAX`);
  } catch (error) {
    console.error("Error during distribution:", error);
  }
}

// Example: Send AVAX to a single recipient
sendAVAX(
  "0xCA2872e950D7C4d1CCaf731625392182F8BB199d", // Recipient address
  "5000" // Amount in AVAX
);


