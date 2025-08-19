// Example: Vote on an agenda using ethers.js
import { ethers } from "ethers";

const provider = new ethers.BrowserProvider(window.ethereum);
await provider.send("eth_requestAccounts", []);
const signer = await provider.getSigner();

const agendaContract = new ethers.Contract(
  "0xYourAgendaContractAddress",
  agendaAbi,
  signer
);

const agendaId = 1; // example agenda ID
const voteOption = 0; // e.g., 0 = Yes, 1 = No
const tx = await agendaContract.vote(agendaId, voteOption);
await tx.wait();
console.log("Vote submitted!");