// src/panels/SettingsPanel.tsx
export function SettingsPanel() {
  return (
    <div style={{ padding: 24, fontFamily: 'system-ui' }}>
      <h2>PixelPet 设置</h2>
      <p style={{ color: '#888' }}>开机自启、音效等设置将在后续版本中添加。</p>
      <p>当前版本: 0.1.0</p>
      <button onClick={() => window.close()}>关闭</button>
    </div>
  );
}
