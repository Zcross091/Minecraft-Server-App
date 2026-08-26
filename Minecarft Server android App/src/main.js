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

    // 8. Players & Moderation List
    const playersList = document.getElementById('playersList');
    const lblPlayerCountBadge = document.getElementById('lblPlayerCountBadge');
    if (playersList && state.players) {
      if (lblPlayerCountBadge) {
        lblPlayerCountBadge.textContent = `${state.players.filter(p => !p.isBanned).length} Active`;
      }
      playersList.innerHTML = state.players.map(p => `
        <div class="plugin-card" style="padding: 10px 14px; margin-bottom: 8px;">
          <div class="plugin-info">
            <div style="font-size: 1.2rem;">${p.platform === 'JAVA' ? '☕' : '📱'}</div>
            <div>
              <div style="font-weight: 700; font-size: 0.9rem; display: flex; align-items: center; gap: 6px;">
                ${escapeHtml(p.username)}
                ${p.isOp ? '<span class="badge" style="padding: 2px 6px; font-size: 0.65rem; background: rgba(234, 179, 8, 0.2); border-color: rgba(234, 179, 8, 0.4); color: #facc15;">👑 OP</span>' : ''}
                ${p.isWhitelisted ? '<span class="badge" style="padding: 2px 6px; font-size: 0.65rem;">🛡️ Whitelist</span>' : ''}
                ${p.isBanned ? '<span class="badge" style="padding: 2px 6px; font-size: 0.65rem; background: rgba(239, 68, 68, 0.2); color: #f87171;">🚫 Banned</span>' : ''}
              </div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">${p.platform} Edition • ${p.ping || 20}ms ping</div>
            </div>
          </div>
          <div style="display: flex; gap: 6px;">
            <button class="btn btn-secondary btn-player-op" data-user="${escapeHtml(p.username)}" style="width: auto; padding: 4px 8px; font-size: 0.75rem;">
              ${p.isOp ? 'De-OP' : 'OP'}
            </button>
            <button class="btn btn-secondary btn-player-kick" data-user="${escapeHtml(p.username)}" style="width: auto; padding: 4px 8px; font-size: 0.75rem;">
              Kick
            </button>
            <button class="btn btn-secondary btn-player-ban" data-user="${escapeHtml(p.username)}" style="width: auto; padding: 4px 8px; font-size: 0.75rem; color: ${p.isBanned ? '#4ade80' : '#f87171'};">
              ${p.isBanned ? 'Unban' : 'Ban'}
            </button>
          </div>
        </div>
      `).join('');

      // Player Action Handlers
      document.querySelectorAll('.btn-player-op').forEach(b => {
        b.addEventListener('click', (e) => {
          const user = e.currentTarget.getAttribute('data-user');
          serverEngine.toggleOp(user);
        });
      });
      document.querySelectorAll('.btn-player-kick').forEach(b => {
        b.addEventListener('click', (e) => {
          const user = e.currentTarget.getAttribute('data-user');
          serverEngine.kickPlayer(user);
        });
      });
      document.querySelectorAll('.btn-player-ban').forEach(b => {
        b.addEventListener('click', (e) => {
          const user = e.currentTarget.getAttribute('data-user');
          const player = state.players.find(p => p.username === user);
          if (player && player.isBanned) {
            serverEngine.unbanPlayer(user);
          } else {
            serverEngine.banPlayer(user);
          }
        });
      });
    }

    // 9. World Backups List
    const backupList = document.getElementById('backupList');
    if (backupList && state.backups) {
      backupList.innerHTML = state.backups.length === 0 ? '<div style="color:var(--text-muted); font-size:0.85rem;">No world backups created yet.</div>' : state.backups.map(b => `
        <div class="plugin-card" style="padding: 10px 14px; margin-bottom: 8px;">
          <div class="plugin-info">
            <div style="font-size: 1.2rem;">📦</div>
            <div>
              <div style="font-weight: 700; font-size: 0.9rem;">${escapeHtml(b.name)}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">${b.timestamp} • ${b.sizeMB} MB (.zip snapshot)</div>
            </div>
          </div>
          <div style="display: flex; gap: 6px;">
            <button class="btn btn-secondary btn-restore-backup" data-id="${escapeHtml(b.id)}" style="width: auto; padding: 4px 8px; font-size: 0.75rem;">
              Restore
            </button>
            <button class="btn btn-secondary btn-delete-backup" data-id="${escapeHtml(b.id)}" style="width: auto; padding: 4px 8px; font-size: 0.75rem; color: #f87171;">
              🗑️
            </button>
          </div>
        </div>
      `).join('');

      document.querySelectorAll('.btn-restore-backup').forEach(b => {
        b.addEventListener('click', (e) => {
          const id = e.currentTarget.getAttribute('data-id');
          if (confirm('Restore world files from this backup? Current world progress will be reverted.')) {
            serverEngine.restoreBackup(id);
          }
        });
      });

      document.querySelectorAll('.btn-delete-backup').forEach(b => {
        b.addEventListener('click', (e) => {
          const id = e.currentTarget.getAttribute('data-id');
          if (confirm('Delete this world backup snapshot?')) {
            serverEngine.deleteBackup(id);
          }
        });
      });
    }

    // 10. Sync Settings Inputs (Only when not focused by the user)
    const settingGamemode = document.getElementById('settingGamemode');
    const settingDifficulty = document.getElementById('settingDifficulty');
    const settingPvp = document.getElementById('settingPvp');
    const settingOnlineMode = document.getElementById('settingOnlineMode');
    const settingWhitelist = document.getElementById('settingWhitelist');
    const settingViewDistance = document.getElementById('settingViewDistance');
    const lblViewDistance = document.getElementById('lblViewDistance');
    const settingMotd = document.getElementById('settingMotd');

    if (settingGamemode && state.gameMode && document.activeElement !== settingGamemode) settingGamemode.value = state.gameMode;
    if (settingDifficulty && state.difficulty && document.activeElement !== settingDifficulty) settingDifficulty.value = state.difficulty;
    if (settingPvp && state.pvp !== undefined && document.activeElement !== settingPvp) settingPvp.checked = state.pvp;
    if (settingOnlineMode && state.onlineMode !== undefined && document.activeElement !== settingOnlineMode) settingOnlineMode.checked = !state.onlineMode; // Checked if allowing offline/cracked
    if (settingWhitelist && state.whitelistEnabled !== undefined && document.activeElement !== settingWhitelist) settingWhitelist.checked = state.whitelistEnabled;
    if (settingViewDistance && state.viewDistance && document.activeElement !== settingViewDistance) {
      settingViewDistance.value = state.viewDistance;
      if (lblViewDistance) lblViewDistance.textContent = `${state.viewDistance} Chunks`;
    }
    if (settingMotd && state.motd && document.activeElement !== settingMotd) settingMotd.value = state.motd;
    if (settingServerName && state.serverName && document.activeElement !== settingServerName) settingServerName.value = state.serverName;
    if (settingFolder && state.serverFolder && document.activeElement !== settingFolder) settingFolder.value = state.serverFolder;
    if (settingRam && state.ramGB && document.activeElement !== settingRam) {
      settingRam.value = state.ramGB;
      if (lblRamVal) lblRamVal.textContent = `${state.ramGB} GB`;
    }

    // 11. Terminal Logs Rendering
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

  // --- Add Player Button Handler ---
  const inputAddPlayer = document.getElementById('inputAddPlayer');
  const btnAddPlayer = document.getElementById('btnAddPlayer');
  if (btnAddPlayer && inputAddPlayer) {
    btnAddPlayer.addEventListener('click', () => {
      const user = inputAddPlayer.value.trim();
      if (user) {
        serverEngine.addPlayer(user, user.startsWith('.') || user.startsWith('*') ? 'BEDROCK' : 'JAVA');
        inputAddPlayer.value = '';
      }
    });
    inputAddPlayer.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const user = inputAddPlayer.value.trim();
        if (user) {
          serverEngine.addPlayer(user, 'JAVA');
          inputAddPlayer.value = '';
        }
      }
    });
  }

  // --- 1-Tap Modpack Preset Handlers ---
  document.querySelectorAll('.btn-preset').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const presetId = e.currentTarget.getAttribute('data-preset');
      if (confirm(`Apply the ${presetId} gameplay preset to your server?`)) {
        serverEngine.applyPreset(presetId);
        alert('Preset applied successfully!');
      }
    });
  });

  // --- Backup Creation Handler ---
  const btnCreateBackup = document.getElementById('btnCreateBackup');
  if (btnCreateBackup) {
    btnCreateBackup.addEventListener('click', () => {
      const name = prompt('Enter a name for this world backup snapshot:', `Backup_${new Date().toLocaleDateString().replace(/\//g,'-')}`);
      if (name !== null) {
        serverEngine.createWorldBackup(name);
        alert('World backup created and saved to phone storage!');
      }
    });
  }

  // --- Server Properties Save Handler ---
  const btnSaveProperties = document.getElementById('btnSaveProperties');
  if (btnSaveProperties) {
    btnSaveProperties.addEventListener('click', () => {
      const settingGamemode = document.getElementById('settingGamemode');
      const settingDifficulty = document.getElementById('settingDifficulty');
      const settingPvp = document.getElementById('settingPvp');
      const settingOnlineMode = document.getElementById('settingOnlineMode');
      const settingWhitelist = document.getElementById('settingWhitelist');
      const settingViewDistance = document.getElementById('settingViewDistance');
      const settingMotd = document.getElementById('settingMotd');

      serverEngine.updateConfig({
        gameMode: settingGamemode ? settingGamemode.value : 'SURVIVAL',
        difficulty: settingDifficulty ? settingDifficulty.value : 'NORMAL',
        pvp: settingPvp ? settingPvp.checked : true,
        onlineMode: settingOnlineMode ? !settingOnlineMode.checked : true, // Inverted: checked = allow offline/cracked
        whitelistEnabled: settingWhitelist ? settingWhitelist.checked : false,
        viewDistance: settingViewDistance ? parseInt(settingViewDistance.value, 10) : 8,
        motd: settingMotd ? settingMotd.value.trim() : 'A Crossplay Minecraft SMP Server'
      });

      alert('Server properties applied successfully!');
    });
  }

  const settingViewDistance = document.getElementById('settingViewDistance');
  const lblViewDistance = document.getElementById('lblViewDistance');
  if (settingViewDistance && lblViewDistance) {
    settingViewDistance.addEventListener('input', (e) => {
      lblViewDistance.textContent = `${e.target.value} Chunks`;
    });
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

  const btnRegenTunnel = document.getElementById('btnRegenTunnel');
  if (btnRegenTunnel) {
    btnRegenTunnel.addEventListener('click', () => {
      const newDomain = serverEngine.regenerateTunnelDomain();
      if (credTunnel) credTunnel.value = newDomain;
    });
  }

  if (credTunnel) {
    credTunnel.addEventListener('change', (e) => {
      const customDomain = e.target.value.trim();
      if (customDomain) {
        serverEngine.updateConfig({ tunnelDomain: customDomain });
      }
    });
  }

  btnCopyInvite.addEventListener('click', () => {
    const inviteText = `🎮 JOIN MY MINECRAFT SMP CROSSPLAY SERVER! 🎮

★ JAVA EDITION (PC / Mac / Linux)
Server Address: ${serverEngine.state.publicIp}:${serverEngine.state.javaPort}

★ BEDROCK EDITION (Android / iOS / Windows / Console)
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
    const folder = prompt('Enter directory path to save Minecraft server files:', settingFolder.value);
    if (folder) {
      settingFolder.value = folder;
    }
  });

  btnSaveConfig.addEventListener('click', () => {
    const newName = settingServerName.value.trim() || 'SMP';
    const newFolder = settingFolder.value.trim() || '/sdcard/Download/MinecraftServers/SMP';
    const newRam = parseInt(settingRam.value, 10) || 4;

    serverEngine.updateConfig({
      serverName: newName,
      serverFolder: newFolder,
      ramGB: newRam
    });

    alert(`Settings saved successfully!\nServer Name: ${newName}\nFolder: ${newFolder}\nRAM: ${newRam}GB`);
  });

  function escapeHtml(str) {
    return String(str || '').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
});
