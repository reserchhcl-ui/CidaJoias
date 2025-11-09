// App.js

import React, { useState, useEffect } from 'react';
import ProductCard from './ProductCard'; 
import logo from './logo.svg';
import './App.css';

function App() {
  const [produtos, setProdutos] = useState([]);
  // 1. NOVO ESTADO: Criamos um estado para guardar o termo da pesquisa.
  //    Ele começa como uma string vazia.
  const [termoPesquisa, setTermoPesquisa] = useState('');

  useEffect(() => {
    // Nenhuma alteração aqui, continuamos a buscar todos os produtos uma vez.
    fetch('http://localhost:3001/produtos')
      .then(response => response.json())
      .then(data => setProdutos(data))
      .catch(error => console.error('Erro ao buscar produtos:', error));
  }, []);

  // 2. LÓGICA DE FILTRAGEM:
  //    Antes de renderizar, filtramos a lista de 'produtos'.
  const produtosFiltrados = produtos.filter(produto =>
    // Verificamos se o nome do produto (em minúsculas) inclui o
    // termo da pesquisa (também em minúsculas).
    // Isto torna a pesquisa insensível a maiúsculas/minúsculas.
    produto.nome.toLowerCase().includes(termoPesquisa.toLowerCase())
  );

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <h1>Produtos da Cida Semi Joias</h1>

        {/* 3. CAMPO DE PESQUISA (INPUT): */}
        <input
          type="text"
          className="search-bar" // Adicionamos uma classe para estilizar
          placeholder="Pesquisar por nome do produto..."
          // O valor do input é o nosso estado 'termoPesquisa'.
          value={termoPesquisa}
          // Quando o utilizador digita, atualizamos o estado.
          // e.target.value contém o texto atual do campo.
          onChange={(e) => setTermoPesquisa(e.target.value)}
        />
      </header>
      
      <div className="products-container">
        {/* 4. RENDERIZAÇÃO DA LISTA FILTRADA:
            Alteramos 'produtos.map' para 'produtosFiltrados.map'.
            Agora, apenas os produtos que passaram no filtro serão exibidos. */}
        {produtosFiltrados.map(produto => (
          <ProductCard key={produto.id} produto={produto} />
        ))}
      </div>
    </div>
  );
}

export default App;