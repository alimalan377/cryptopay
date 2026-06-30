(function() {
  const CONTRACT = "0xb6beFa9ec5bfC7DaD2b5610579ca4fFf0506A005";
  const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
  const BASE_CHAIN_ID = "0x2105";

  const style = document.createElement("style");
  style.textContent = `
    #cryptopay-btn {
      background: #00d4ff;
      color: #000;
      border: none;
      padding: 12px 28px;
      border-radius: 10px;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
      font-family: 'Segoe UI', sans-serif;
      transition: opacity 0.2s;
    }
    #cryptopay-btn:hover { opacity: 0.85; }
    #cryptopay-overlay {
      position: fixed; top: 0; left: 0;
      width: 100%; height: 100%;
      background: rgba(0,0,0,0.7);
      z-index: 99999;
      display: flex; align-items: center; justify-content: center;
    }
    #cryptopay-modal {
      background: #1a1a2e;
      border: 1px solid #2a2a4a;
      border-radius: 20px;
      padding: 32px;
      width: 360px;
      font-family: 'Segoe UI', sans-serif;
      color: #fff;
    }
    #cryptopay-modal h2 {
      font-size: 1.2rem;
      margin-bottom: 6px;
      color: #00d4ff;
    }
    #cryptopay-modal .subtitle {
      font-size: 12px;
      color: #666;
      margin-bottom: 24px;
    }
    #cryptopay-modal .amount-box {
      background: #0f0f17;
      border: 1px solid #2a2a4a;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      margin-bottom: 20px;
    }
    #cryptopay-modal .amount-box .label {
      font-size: 11px;
      color: #555;
      margin-bottom: 4px;
    }
    #cryptopay-modal .amount-box .amount {
      font-size: 2rem;
      font-weight: 700;
      color: #00ff88;
    }
    #cryptopay-modal .amount-box .currency {
      font-size: 13px;
      color: #888;
      margin-top: 2px;
    }
    #cryptopay-modal .info-row {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      padding: 6px 0;
      border-bottom: 1px solid #2a2a3a;
      color: #888;
    }
    #cryptopay-modal .info-row:last-of-type { border-bottom: none; }
    #cryptopay-modal .info-row span:last-child { color: #fff; }
    #cryptopay-modal .pay-btn {
      width: 100%;
      padding: 14px;
      background: #00d4ff;
      color: #000;
      border: none;
      border-radius: 10px;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
      margin-top: 20px;
    }
    #cryptopay-modal .pay-btn:hover { opacity: 0.85; }
    #cryptopay-modal .cancel-btn {
      width: 100%;
      padding: 10px;
      background: transparent;
      color: #555;
      border: 1px solid #2a2a4a;
      border-radius: 10px;
      font-size: 13px;
      cursor: pointer;
      margin-top: 8px;
    }
    #cryptopay-modal .cancel-btn:hover { color: #fff; }
    #cryptopay-modal .msg {
      font-size: 12px;
      text-align: center;
      margin-top: 12px;
      padding: 8px;
      border-radius: 6px;
      display: none;
    }
    #cryptopay-modal .msg.info { background: #0d1e2e; color: #00d4ff; display: block; }
    #cryptopay-modal .msg.success { background: #0d2e1a; color: #00ff88; display: block; }
    #cryptopay-modal .msg.error { background: #2e0d0d; color: #ff4444; display: block; }
    #cryptopay-modal .success-icon {
      text-align: center;
      font-size: 3rem;
      margin: 16px 0;
      display: none;
    }
    #cryptopay-modal .powered {
      text-align: center;
      font-size: 10px;
      color: #333;
      margin-top: 16px;
    }
    #cryptopay-modal .powered a {
      color: #00d4ff;
      text-decoration: none;
    }
  `;
  document.head.appendChild(style);

  function padHex(str, len) {
    return str.padStart(len, "0");
  }

  function encodeString(str) {
    const bytes = new TextEncoder().encode(str);
    const lenHex = padHex(bytes.length.toString(16), 64);
    let dataHex = "";
    for (let b of bytes) dataHex += b.toString(16).padStart(2, "0");
    const paddedData = dataHex.padEnd(Math.ceil(dataHex.length / 64) * 64, "0");
    return lenHex + paddedData;
  }

  function createModal(config) {
    const overlay = document.createElement("div");
    overlay.id = "cryptopay-overlay";
    overlay.innerHTML = `
      <div id="cryptopay-modal">
        <h2>Complete Payment</h2>
        <p class="subtitle">Powered by CryptoPay Gateway on Base</p>
        <div class="amount-box">
          <div class="label">AMOUNT TO PAY</div>
          <div class="amount">${config.amount}</div>
          <div class="currency">USDC on Base Network</div>
        </div>
        <div class="info-row"><span>Order ID</span><span>${config.orderId}</span></div>
        <div class="info-row"><span>Merchant</span><span>${config.merchantId}</span></div>
        <div class="info-row"><span>Network</span><span>Base Mainnet</span></div>
        <div class="info-row"><span>Fee</span><span>1%</span></div>
        <div class="success-icon" id="cp-success-icon">✅</div>
        <div class="msg" id="cp-msg"></div>
        <button class="pay-btn" id="cp-pay-btn" onclick="window._cryptopay_pay()">
          Pay ${config.amount} USDC
        </button>
        <button class="cancel-btn" onclick="window._cryptopay_close()">Cancel</button>
        <div class="powered">Secured by <a href="https://cryptopay-gilt.vercel.app" target="_blank">CryptoPay</a></div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  function showMsg(text, type) {
    const el = document.getElementById("cp-msg");
    el.textContent = text;
    el.className = "msg " + type;
  }

  window._cryptopay_close = function() {
    const overlay = document.getElementById("cryptopay-overlay");
    if (overlay) overlay.remove();
  };

  window._cryptopay_pay = async function() {
    const config = window._cryptopay_config;
    if (!window.ethereum) { showMsg("Please install MetaMask or Rabby Wallet", "error"); return; }

    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const wallet = accounts[0];

      const chainId = await window.ethereum.request({ method: "eth_chainId" });
      if (chainId !== BASE_CHAIN_ID) {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: BASE_CHAIN_ID }]
        });
      }

      showMsg("Step 1/2: Approving USDC...", "info");
      document.getElementById("cp-pay-btn").disabled = true;

      const amountRaw = BigInt(Math.round(config.amount * 1e6));
      const contractHex = padHex(CONTRACT.slice(2).toLowerCase(), 64);
      const amountHex = padHex(amountRaw.toString(16), 64);

      await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [{ from: wallet, to: USDC, data: "0x095ea7b3" + contractHex + amountHex, gas: "0x15000" }]
      });

      await new Promise(r => setTimeout(r, 3000));

      showMsg("Step 2/2: Sending payment...", "info");

      const offset1 = padHex("60", 64);
      const orderBytes = new TextEncoder().encode(config.orderId);
      const merchantBytes = new TextEncoder().encode(config.merchantId);
      const offset2 = padHex((96 + Math.ceil(orderBytes.length / 32) * 32 + 32).toString(16), 64);
      const encodedOrder = encodeString(config.orderId);
      const encodedMerchant = encodeString(config.merchantId);
      const data = "0x7d783a3e" + offset1 + offset2 + amountHex + encodedOrder + encodedMerchant;

      await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [{ from: wallet, to: CONTRACT, data, gas: "0x493E0" }]
      });

      showMsg("Payment successful! Thank you.", "success");
      document.getElementById("cp-success-icon").style.display = "block";
      document.getElementById("cp-pay-btn").style.display = "none";

      if (config.onSuccess) config.onSuccess(config.orderId);

      setTimeout(() => window._cryptopay_close(), 4000);

    } catch(e) {
      showMsg("Error: " + (e.message || "Transaction cancelled"), "error");
      document.getElementById("cp-pay-btn").disabled = false;
    }
  };

  window.CryptoPay = {
    pay: function(config) {
      window._cryptopay_config = config;
      createModal(config);
    }
  };

  const buttons = document.querySelectorAll("[data-cryptopay]");
  buttons.forEach(btn => {
    btn.id = "cryptopay-btn";
    btn.addEventListener("click", function() {
      window.CryptoPay.pay({
        orderId: btn.getAttribute("data-order-id"),
        merchantId: btn.getAttribute("data-merchant-id"),
        amount: parseFloat(btn.getAttribute("data-amount")),
        onSuccess: function(orderId) {
          console.log("Payment completed for order: " + orderId);
        }
      });
    });
  });
})();