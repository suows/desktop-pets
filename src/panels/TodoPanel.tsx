// src/panels/TodoPanel.tsx
import { useState, useEffect } from 'react';

interface Todo {
  id: string;
  text: string;
  done: boolean;
  createdAt: string;
}

export function TodoPanel() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newText, setNewText] = useState('');

  const loadTodos = () => {
    window.electronAPI?.todo.list().then(setTodos);
  };

  useEffect(() => {
    loadTodos();
  }, []);

  const handleAdd = async () => {
    const trimmed = newText.trim();
    if (!trimmed) return;
    const updatedTodos = await window.electronAPI!.todo.add(trimmed);
    setTodos(updatedTodos);
    setNewText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdd();
    }
  };

  const handleToggle = async (id: string) => {
    const updatedTodos = await window.electronAPI!.todo.toggle(id);
    setTodos(updatedTodos);
  };

  const handleDelete = async (id: string) => {
    const updatedTodos = await window.electronAPI!.todo.delete(id);
    setTodos(updatedTodos);
  };

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    padding: 16,
    fontFamily: 'system-ui, sans-serif',
    boxSizing: 'border-box',
    backgroundColor: '#fff',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 16,
    fontWeight: 600,
    margin: 0,
  };

  const closeBtnStyle: React.CSSProperties = {
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    fontSize: 16,
    color: '#999',
    padding: '4px 8px',
    borderRadius: 4,
  };

  const listStyle: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    marginBottom: 12,
  };

  const itemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    padding: '6px 0',
    borderBottom: '1px solid #f0f0f0',
  };

  const checkboxStyle: React.CSSProperties = {
    cursor: 'pointer',
    marginRight: 8,
    fontSize: 16,
    background: 'none',
    border: 'none',
    padding: 0,
    lineHeight: 1,
    color: '#333',
  };

  const deleteBtnStyle: React.CSSProperties = {
    marginLeft: 'auto',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    fontSize: 14,
    color: '#ccc',
    padding: '2px 4px',
    borderRadius: 4,
  };

  const inputRowStyle: React.CSSProperties = {
    display: 'flex',
    gap: 8,
  };

  const inputStyle: React.CSSProperties = {
    flex: 1,
    padding: '6px 10px',
    border: '1px solid #ddd',
    borderRadius: 4,
    fontSize: 13,
    outline: 'none',
    fontFamily: 'inherit',
  };

  const addBtnStyle: React.CSSProperties = {
    padding: '6px 14px',
    border: 'none',
    borderRadius: 4,
    backgroundColor: '#FF8C42',
    color: '#fff',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
    fontFamily: 'inherit',
  };

  const pendingCount = todos.filter(t => !t.done).length;

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2 style={titleStyle}>
          📋 待办事项
          {pendingCount > 0 && (
            <span style={{ fontSize: 12, color: '#999', fontWeight: 400, marginLeft: 8 }}>
              ({pendingCount})
            </span>
          )}
        </h2>
        <button style={closeBtnStyle} onClick={() => window.close()}>✕</button>
      </div>

      <div style={listStyle}>
        {todos.length === 0 && (
          <p style={{ color: '#bbb', fontSize: 13, textAlign: 'center', marginTop: 40 }}>
            还没有待办事项
          </p>
        )}
        {todos.map((todo) => (
          <div key={todo.id} style={itemStyle}>
            <button
              style={{
                ...checkboxStyle,
                color: todo.done ? '#ccc' : '#FF8C42',
              }}
              onClick={() => handleToggle(todo.id)}
            >
              {todo.done ? '☑' : '☐'}
            </button>
            <span
              style={{
                fontSize: 13,
                textDecoration: todo.done ? 'line-through' : 'none',
                color: todo.done ? '#999' : '#333',
                flex: 1,
                wordBreak: 'break-word',
              }}
            >
              {todo.text}
            </span>
            <button
              style={deleteBtnStyle}
              onClick={() => handleDelete(todo.id)}
              title="删除"
            >
              🗑
            </button>
          </div>
        ))}
      </div>

      <div style={inputRowStyle}>
        <input
          style={inputStyle}
          type="text"
          placeholder="输入待办事项..."
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button style={addBtnStyle} onClick={handleAdd}>
          添加
        </button>
      </div>
    </div>
  );
}
