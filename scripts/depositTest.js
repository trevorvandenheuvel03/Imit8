const { ethers } = require("ethers");

// Configuration
const CONTRACT_ADDRESS = "0x3e411e0ae0484ae34127776b04550e6c985dc605";
const RPC_URL = "https://subnets.avacloud.io/f42c253d-a0d9-4326-b568-2ea514391459"; // Replace with your Avalanche RPC URL
const PRIVATE_KEY = ""; // Replace with your wallet's private key

// ABI of the NativeTokenDistributor contract
const ABI = [
  "function deposit() external payable",
  "function withdraw(uint256 amount) external",
  "function getBalance() external view returns (uint256)",
  "function distribute(address[] recipients, uint256[] amounts) external"
];


(async () => {
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