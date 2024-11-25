const { ethers } = require("ethers");
require('dotenv').config();

// ABI of the NativeTokenDistributor contract
const ABI = [
  "function deposit() external payable",
  "function withdraw(uint256 amount) external",
  "function getBalance() external view returns (uint256)",
  "function distribute(address[] recipients, uint256[] amounts) external"
];
async function depositAVAX(amountInEther) {

  const RPC_URL = process.env.RPC_URL;
  const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
  const PRIVATE_KEY = process.env.PRIVATE_KEY;

  // Validate environment variables
  if (!RPC_URL || !CONTRACT_ADDRESS || !PRIVATE_KEY) {
    throw new Error("Missing required environment variables");
  }
  
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

  console.log(`Connected to contract: ${CONTRACT_ADDRESS}`);

  try {
    console.log(`Depositing ${amountInEther} AVAX...`);
    const tx = await contract.deposit({ value: ethers.utils.parseEther(amountInEther) });
    await tx.wait();
    console.log(`Deposit successful: ${tx.hash}`);

    const balance = await contract.getBalance();
    console.log(`Updated contract balance: ${ethers.utils.formatEther(balance)} AVAX`);
  } catch (error) {
    console.error("Error during deposit:", error);
  }
}

depositAVAX("100000"); // Adjust the deposit amount as needed
