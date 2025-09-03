import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

console.log('🚀 main.tsx ejecutándose...');
console.log('🔍 Elemento root:', document.getElementById('root'));

const root = ReactDOM.createRoot(document.getElementById('root')!);
console.log('🔍 Root creado:', root);

root.render(<App />);
console.log('🔍 App renderizado');
