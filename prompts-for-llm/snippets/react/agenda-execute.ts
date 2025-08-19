// Example: Execute an agenda using ethers.js
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
const tx = await agendaContract.executeAgenda(agendaId);
await tx.wait();
console.log("Agenda executed!");