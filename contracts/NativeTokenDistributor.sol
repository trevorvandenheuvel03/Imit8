// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract NativeTokenDistributor {
    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // Function to deposit native tokens into the contract
    function deposit() external payable {}

    // Distribute native tokens to multiple addresses
    function distribute(address payable[] calldata recipients, uint256[] calldata amounts) external onlyOwner {
        require(recipients.length == amounts.length, "Recipients and amounts length mismatch");

        for (uint256 i = 0; i < recipients.length; i++) {
            require(address(this).balance >= amounts[i], "Insufficient contract balance");
            recipients[i].transfer(amounts[i]);
        }
    }

    // Withdraw any remaining native tokens
    function withdraw(uint256 amount) external onlyOwner {
        require(address(this).balance >= amount, "Insufficient contract balance");
        payable(owner).transfer(amount);
    }

    // Check the contract balance
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}