// ProductCard.js

import React from 'react';
import './ProductCard.css'; // Vamos criar este ficheiro a seguir

// Este é um componente de função. Ele recebe "props" (propriedades)
// como argumento, que são os dados que passamos para ele (neste caso, o produto).
function ProductCard({ produto }) {
  return (
    <div className="product-card">
      {/* No futuro, podemos adicionar uma imagem aqui */}
	<img src={produto.imagemUrl} alt={produto.nome} className="product-image" />
      <h3 className="product-name">{produto.nome}</h3>
      <p className="product-price">R$ {produto.preco.toFixed(2)}</p>
      <button className="buy-button">Adicionar ao Carrinho</button>
    </div>
  );
}

export default ProductCard;