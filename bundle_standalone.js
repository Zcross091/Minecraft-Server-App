const fs = require('fs');
const path = require('path');

function buildStandaloneApp(appFolder, platformName) {
  console.log(`[Standalone Bundler] Packaging ${platformName}...`);

  const indexPath = path.join(appFolder, 'index.html');
  const cssPath = path.join(appFolder, 'src', 'style.css');
  const enginePath = path.join(appFolder, 'src', 'engine', 'serverEngine.js');
  const mainPath = path.join(appFolder, 'src', 'main.js');

  let html = fs.readFileSync(indexPath, 'utf-8');
  let css = fs.readFileSync(cssPath, 'utf-8');
  let engineJs = fs.readFileSync(enginePath, 'utf-8');
  let mainJs = fs.readFileSync(mainPath, 'utf-8');

  // Strip ES module imports/exports from JS
  engineJs = engineJs
    .replace(/^import\s+.*?;?\s*$/gm, '')
    .replace(/^export\s+class\s+/gm, 'class ')
    .replace(/^export\s+const\s+serverEngine\s*=\s*new\s+ServerEngine\(\);/gm, 'window.serverEngine = new ServerEngine();');

  mainJs = mainJs
    .replace(/^import\s+.*?;?\s*$/gm, '');

  const combinedJs = `
// Standalone Native Engine Bundle for ${platformName}
(function() {
${engineJs}

const serverEngine = window.serverEngine;

${mainJs}
})();
  `;

  // Inline CSS into <style> tag
  const styleTag = `<style>\n${css}\n</style>`;

  // Inline JS into <script> tag (no type="module", no crossorigin)
  const scriptTag = `<script>\n${combinedJs}\n</script>`;

  // Replace link style and script module in HTML template
  html = html
    .replace(/<link\s+rel="stylesheet"\s+href=".*?"\s*\/?>/i, styleTag)
    .replace(/<script\s+type="module"\s+src=".*?"\s*><\/script>/i, scriptTag)
    .replace(/<img\s+src=".*?"\s+alt="(.*?)"\s+class="brand-icon"\s*\/?>/i, 
             `<img src="./app-icon.png" alt="$1" class="brand-icon" style="width: 40px; height: 40px; border-radius: 12px; object-fit: cover; flex-shrink: 0;" />`);

  // Target outputs
  const distDir = path.join(appFolder, 'dist');
  fs.mkdirSync(distDir, { recursive: true });
  fs.writeFileSync(path.join(distDir, 'index.html'), html, 'utf-8');

  // Copy app-icon.png to dist
  const iconSrc = path.join(appFolder, 'public', 'app-icon.png');
  if (fs.existsSync(iconSrc)) {
    fs.copyFileSync(iconSrc, path.join(distDir, 'app-icon.png'));
  }

  // Copy to Android assets or iOS public
  if (platformName === 'Android') {
    const androidAssets = path.join(appFolder, 'android', 'app', 'src', 'main', 'assets');
    fs.mkdirSync(androidAssets, { recursive: true });
    fs.writeFileSync(path.join(androidAssets, 'index.html'), html, 'utf-8');
    if (fs.existsSync(iconSrc)) {
      fs.copyFileSync(iconSrc, path.join(androidAssets, 'app-icon.png'));
    }
  } else if (platformName === 'iOS') {
    const iosPublic = path.join(appFolder, 'ios', 'App', 'App', 'public');
    fs.mkdirSync(iosPublic, { recursive: true });
    fs.writeFileSync(path.join(iosPublic, 'index.html'), html, 'utf-8');
    if (fs.existsSync(iconSrc)) {
      fs.copyFileSync(iconSrc, path.join(iosPublic, 'app-icon.png'));
    }
  }

  console.log(`[Standalone Bundler] Successfully generated self-contained index.html for ${platformName}!`);
}

buildStandaloneApp(path.join(__dirname, 'Minecarft Server android App'), 'Android');
buildStandaloneApp(path.join(__dirname, 'Minecraft Server ios App'), 'iOS');
