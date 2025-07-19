import { useEffect, useState } from "react";
import { ethers } from "ethers";

const PRESALE_ADDRESS = "0x555c071e98db97e6d8e2255a7076e934973ce225";
const ABI = [
  "function buyTokens() payable",
  "function tokenSold() view returns (uint256)"
];
const START_TIME = new Date("2025-07-20T00:00:00Z").getTime();
const END_TIME = new Date("2025-09-20T00:00:00Z").getTime();
const TOTAL_TOKENS = 300_000_000;
const RATE = 12_000_000;

export default function App() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [ethAmount, setEthAmount] = useState("");
  const [status, setStatus] = useState("");
  const [countdown, setCountdown] = useState("");
  const [expectedTokens, setExpectedTokens] = useState(0);
  const [progress, setProgress] = useState(0);
  const [sold, setSold] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      if (now < START_TIME) {
        const diff = START_TIME - now;
        setCountdown("Presale starts in: " + formatTime(diff));
      } else if (now < END_TIME) {
        const diff = END_TIME - now;
        setCountdown("Presale ends in: " + formatTime(diff));
      } else {
        setCountdown("Presale has ended.");
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const eth = parseFloat(ethAmount);
    setExpectedTokens(isNaN(eth) ? 0 : eth * RATE);
  }, [ethAmount]);

  const formatTime = (ms) => {
    const d = Math.floor(ms / (1000 * 60 * 60 * 24));
    const h = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const m = Math.floor((ms / (1000 * 60)) % 60);
    const s = Math.floor((ms / 1000) % 60);
    return `${d}d ${h}h ${m}m ${s}s`;
  };

  const connectWallet = async () => {
    if (!window.ethereum) return alert("Please install MetaMask");
    const tempProvider = new ethers.BrowserProvider(window.ethereum);
    const tempSigner = await tempProvider.getSigner();
    setProvider(tempProvider);
    setSigner(tempSigner);
    setStatus("✅ Wallet connected");
  };

  const buyTokens = async () => {
    if (!signer) return alert("Connect wallet first");
    try {
      const contract = new ethers.Contract(PRESALE_ADDRESS, ABI, signer);
      const tx = await contract.buyTokens({ value: ethers.parseEther(ethAmount) });
      setStatus("⏳ Waiting for confirmation...");
      await tx.wait();
      setStatus("✅ Purchase complete!");
      fetchProgress();
    } catch (err) {
      console.error(err);
      setStatus("❌ Transaction failed");
    }
  };

  const fetchProgress = async () => {
    try {
      const tempProvider = new ethers.JsonRpcProvider("https://mainnet.base.org");
      const contract = new ethers.Contract(PRESALE_ADDRESS, ABI, tempProvider);
      const tokenSold = await contract.tokenSold();
      const soldValue = parseFloat(ethers.formatUnits(tokenSold, 18));
      setSold(soldValue);
      setProgress((soldValue / TOTAL_TOKENS) * 100);
    } catch (err) {
      console.error("Error fetching progress", err);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, []);

  return (
    <div style={{
      minHeight: "100vh", backgroundColor: "#0d0d0d", color: "#fff",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "2rem", fontFamily: "Arial"
    }}>
      <div style={{
        width: "100%", maxWidth: "500px", backgroundColor: "#111",
        border: "2px solid hotpink", borderRadius: "16px", padding: "2rem",
        boxShadow: "0 0 20px hotpink"
      }}>
        <h1 style={{ color: "hotpink", textAlign: "center" }}>🚀 DEXTER Presale</h1>
        <p style={{ textAlign: "center" }}>{countdown}</p>
        <div style={{ background: "#333300", color: "gold", padding: "10px", borderRadius: "8px", textAlign: "center" }}>
          ⚠️ Early access — presale starts July 20
        </div>
        <button onClick={connectWallet} style={{
          width: "100%", padding: "12px", backgroundColor: "hotpink", color: "#fff",
          borderRadius: "8px", border: "none", marginTop: "20px"
        }}>
          🔌 Connect Wallet
        </button>
        <input
          type="number"
          value={ethAmount}
          onChange={e => setEthAmount(e.target.value)}
          placeholder="Amount in ETH"
          style={{
            width: "100%", padding: "12px", marginTop: "15px",
            borderRadius: "8px", border: "none", textAlign: "center"
          }}
        />
        <p style={{ textAlign: "center" }}>You'll get: <strong>{expectedTokens.toLocaleString()}</strong> DEXTER</p>
        <button onClick={buyTokens} style={{
          width: "100%", padding: "12px", backgroundColor: "springgreen", color: "#000",
          borderRadius: "8px", border: "none", fontWeight: "bold"
        }}>
          💸 Buy DEXTER
        </button>
        <p style={{ textAlign: "center", marginTop: "1rem" }}>{status}</p>
        <div style={{ marginTop: "20px" }}>
          <label>Presale Progress:</label>
          <div style={{ background: "#333", borderRadius: "8px", height: "20px", overflow: "hidden" }}>
            <div style={{
              width: `${progress}%`, background: "limegreen", height: "100%",
              transition: "width 0.3s"
            }} />
          </div>
          <p style={{ fontSize: "14px" }}>{sold.toLocaleString()} / {TOTAL_TOKENS.toLocaleString()} DEXTER sold</p>
        </div>
      </div>
    </div>
  );
}