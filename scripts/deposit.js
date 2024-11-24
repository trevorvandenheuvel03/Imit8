const { ethers } = require("ethers");

// Custom L1 setup
const RPC_URL = "https://subnets.avacloud.io/f42c253d-a0d9-4326-b568-2ea514391459"; // Replace with your custom L1 RPC URL
const CONTRACT_ADDRESS = "0x3e411e0ae0484ae34127776b04550e6c985dc605"; // Replace with your deployed contract address
const PRIVATE_KEY = ""; // Replace with your wallet's private key

// ABI of the NativeTokenDistributor contract
const ABI = [
  "function deposit() external payable",
  "function withdraw(uint256 amount) external",
  "function getBalance() external view returns (uint256)",
  "function distribute(address[] recipients, uint256[] amounts) external"
];
async function depositAVAX(amountInEther) {
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
