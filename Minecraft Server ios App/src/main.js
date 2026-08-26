import { serverEngine } from './engine/serverEngine.js';

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const statusPill = document.getElementById('statusPill');
  const statusText = document.getElementById('statusText');
  
  const btnStart = document.getElementById('btnStart');
  const btnStop = document.getElementById('btnStop');
  const btnRestart = document.getElementById('btnRestart');
  const btnOpAdmin = document.getElementById('btnOpAdmin');

  const statPlayers = document.getElementById('statPlayers');
  const statCpu = document.getElementById('statCpu');
  const statRam = document.getElementById('statRam');
  const statRamUsage = document.getElementById('statRamUsage');

  const infoServerName = document.getElementById('infoServerName');
  const infoServerFolder = document.getElementById('infoServerFolder');

  const preinstalledList = document.getElementById('preinstalledList');
  const customPluginsList = document.getElementById('customPluginsList');
  const btnUploadPlugin = document.getElementById('btnUploadPlugin');

  const credJava = document.getElementById('credJava');
  const credBedrockIp = document.getElementById('credBedrockIp');
  const credTunnel = document.getElementById('credTunnel');
  const btnCopyInvite = document.getElementById('btnCopyInvite');

  const terminalBox = document.getElementById('terminalBox');
  const inputCmd = document.getElementById('inputCmd');
  const btnSendCmd = document.getElementById('btnSendCmd');
  const btnClearLogs = document.getElementById('btnClearLogs');

  const settingServerName = document.getElementById('settingServerName');
  const settingFolder = document.getElementById('settingFolder');
  const settingRam = document.getElementById('settingRam');
  const lblRamVal = document.getElementById('lblRamVal');
  const btnSaveConfig = document.getElementById('btnSaveConfig');
  const btnBrowseFolder = document.getElementById('btnBrowseFolder');

  // Navigation Tab Switching Logic
  const navTabs = document.querySelectorAll('.nav-tab');
  const tabPages = document.querySelectorAll('.tab-page');

  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.getAttribute('data-tab');
      
      navTabs.forEach(t => t.classList.remove('active'));
      tabPages.forEach(page => page.style.display = 'none');

      tab.classList.add('active');
      const targetPage = document.getElementById(targetId);
      if (targetPage) targetPage.style.display = 'block';
    });
  });

  // Subscribe to Engine State Changes
  serverEngine.subscribe(renderState);
  renderState(serverEngine.state);

  function renderState(state) {
    // 1. Status Indicator
    statusPill.className = `status-pill ${state.status.toLowerCase()}`;
    statusText.textContent = state.status;

    // 2. Button States
    btnStart.disabled = state.status !== 'STOPPED';
    btnStop.disabled = state.status !== 'RUNNING';
    btnRestart.disabled = state.status !== 'RUNNING';

    // 3. Stats
    statPlayers.textContent = `${state.playersOnline} / ${state.maxPlayers}`;
    statCpu.textContent = `${state.cpuUsage} %`;
    statRam.textContent = `${state.ramGB}.0 GB`;
    statRamUsage.textContent = `${state.memoryUsageMB} MB`;

    // 4. Server Config Info
    infoServerName.value = state.serverName;
    infoServerFolder.value = state.serverFolder;

    // 5. Credentials
    credJava.value = `${state.publicIp}:${state.javaPort}`;
    credBedrockIp.value = state.publicIp;
    credTunnel.value = state.tunnelDomain;

    // 6. Preinstalled Requirements List
    preinstalledList.innerHTML = state.preinstalledPlugins.map(p => `
      <div class="plugin-card">
        <div class="plugin-info">
          <div class="plugin-icon">${escapeHtml(p.icon)}</div>
          <div>
            <div class="plugin-title">${escapeHtml(p.name)} <span class="badge">Preinstalled</span></div>
            <div class="plugin-desc">${escapeHtml(p.description)}</div>
          </div>
        </div>
      </div>
    `).join('');

    // 7. Custom Plugins List
    customPluginsList.innerHTML = state.customPlugins.map(p => `
      <div class="plugin-card">
        <div class="plugin-info">
          <div class="plugin-icon">${escapeHtml(p.icon)}</div>
          <div>
            <div class="plugin-title">${escapeHtml(p.name)} <span style="font-size:0.75rem; color:var(--text-dim);">v${escapeHtml(p.version)}</span></div>
            <div class="plugin-desc">${escapeHtml(p.description)}</div>
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:10px;">
          <label class="switch" title="Enable/Disable Plugin">
            <input type="checkbox" ${p.enabled ? 'checked' : ''} data-plugin-id="${escapeHtml(p.id)}" class="toggle-plugin">
            <span class="slider"></span>
          </label>
          <button class="btn btn-secondary btn-delete-plugin" data-plugin-id="${escapeHtml(p.id)}" title="Delete Plugin" style="width:auto; padding:4px 8px; font-size:0.8rem; background:rgba(239, 68, 68, 0.15); border-color:rgba(239,68,68,0.3); color:#f87171;">
            🗑️
          </button>
        </div>
      </div>
    `).join('');

    // Attach Plugin Toggle Listeners
    document.querySelectorAll('.toggle-plugin').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const id = e.target.getAttribute('data-plugin-id');
        serverEngine.toggleCustomPlugin(id);
      });
    });

    // Attach Plugin Delete Listeners
    document.querySelectorAll('.btn-delete-plugin').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-plugin-id');
        const plugin = state.customPlugins.find(p => p.id === id);
        const name = plugin ? plugin.name : 'this plugin';
        if (confirm(`Uninstall and remove '${name}' from server plugins?`)) {
          serverEngine.removeCustomPlugin(id);
        }
      });
    });

    // 8. Terminal Logs Rendering
    terminalBox.innerHTML = state.logs.map(log => {
      let typeClass = 'INFO';
      if (log.includes('[SUCCESS]')) typeClass = 'SUCCESS';
      else if (log.includes('[NET]')) typeClass = 'NET';
      else if (log.includes('[WARN]')) typeClass = 'WARN';
      else if (log.includes('[ERROR]')) typeClass = 'ERROR';
      else if (log.includes('[SYSTEM]')) typeClass = 'SYSTEM';
      return `<div class="log-line ${typeClass}">${escapeHtml(log)}</div>`;
    }).join('');
    
    // Auto-scroll to bottom of terminal
    terminalBox.scrollTop = terminalBox.scrollHeight;
  }

  // --- Button Event Handlers ---

  btnStart.addEventListener('click', () => {
    serverEngine.startServer();
  });

  btnStop.addEventListener('click', () => {
    serverEngine.stopServer();
  });

  btnRestart.addEventListener('click', () => {
    serverEngine.restartServer();
  });

  btnOpAdmin.addEventListener('click', () => {
    const user = prompt('Enter Minecraft username to give Admin (OP) permissions:', 'PlayerOne');
    if (user) {
      serverEngine.executeCommand(`op ${user}`);
    }
  });

  const filePluginPicker = document.getElementById('filePluginPicker');

  btnUploadPlugin.addEventListener('click', () => {
    if (filePluginPicker) {
      filePluginPicker.click();
    } else {
      const name = prompt('Enter Custom Plugin / Mod Name:', 'MyCustomPlugin');
      if (name) {
        const desc = prompt('Enter description for this plugin:', 'Custom addon for SMP server.');
        serverEngine.addCustomPlugin({ name, description: desc, icon: '📦' });
      }
    }
  });

  if (filePluginPicker) {
    filePluginPicker.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        const rawName = file.name.replace(/\.(jar|zip)$/i, '');
        const cleanName = rawName.replace(/[-_]/g, ' ');
        const sizeKb = (file.size / 1024).toFixed(1);
        serverEngine.addCustomPlugin({
          name: cleanName,
          version: '1.0.0',
          description: `Installed from ${file.name} (${sizeKb} KB)`,
          icon: file.name.toLowerCase().endsWith('.zip') ? '🗜️' : '☕'
        });
        filePluginPicker.value = '';
      }
    });
  }

  btnCopyInvite.addEventListener('click', () => {
    const inviteText = `🎮 JOIN MY iOS MINECRAFT SMP CROSSPLAY SERVER! 🎮

★ JAVA EDITION (PC / Mac / Linux)
Server Address: ${serverEngine.state.publicIp}:${serverEngine.state.javaPort}

★ BEDROCK EDITION (iOS / Android / Windows / Console)
Server Address: ${serverEngine.state.publicIp}
Server Port   : ${serverEngine.state.bedrockPort}

🔗 PUBLIC TUNNEL DOMAIN: ${serverEngine.state.tunnelDomain}

Crossplay & Multi-version support enabled (Java & Bedrock)!`;

    navigator.clipboard.writeText(inviteText).then(() => {
      alert('Invite credentials copied to clipboard! Share with your friends!');
    }).catch(() => {
      alert(inviteText);
    });
  });

  // Terminal Command Execution
  btnSendCmd.addEventListener('click', sendCmd);
  inputCmd.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendCmd();
  });

  function sendCmd() {
    const cmd = inputCmd.value;
    if (cmd) {
      serverEngine.executeCommand(cmd);
      inputCmd.value = '';
    }
  }

  btnClearLogs.addEventListener('click', () => {
    serverEngine.clearLogs();
  });

  // Settings Controls
  settingRam.addEventListener('input', (e) => {
    lblRamVal.textContent = `${e.target.value} GB`;
  });

  btnBrowseFolder.addEventListener('click', () => {
    const folder = prompt('Enter iOS directory path to save Minecraft server files:', settingFolder.value);
    if (folder) {
      settingFolder.value = folder;
    }
  });

  btnSaveConfig.addEventListener('click', () => {
    const newName = settingServerName.value.trim() || 'SMP';
    const newFolder = settingFolder.value.trim() || 'Documents/MinecraftServers/SMP';
    const newRam = parseInt(settingRam.value, 10) || 4;

    serverEngine.updateConfig({
      serverName: newName,
      serverFolder: newFolder,
      ramGB: newRam
    });

    alert(`iOS Server Settings saved!\nServer Name: ${newName}\nFolder: ${newFolder}\nRAM: ${newRam}GB`);
  });

  function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
});
