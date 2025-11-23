"use client";
import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section className="relative h-[90vh] w-full overflow-hidden bg-slate-900">
      {/* Imagem de Fundo */}
      <div 
        className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1573408301185-9146fe634ad0?q=80&w=2075&auto=format&fit=crop')] 
        bg-cover bg-center bg-no-repeat opacity-60"
      />
      
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />

      <div className="relative container mx-auto px-4 h-full flex flex-col justify-center items-start">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-2xl space-y-6"
        >
          <span className="inline-block text-amber-400 font-medium tracking-widest uppercase text-sm">
            Nova Coleção 2025
          </span>
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-white leading-tight">
            Elegância que <br/> conta a sua história.
          </h1>
          <p className="text-lg text-slate-200 max-w-md leading-relaxed">
            Descubra peças exclusivas desenhadas para eternizar momentos. 
            Design autoral com a qualidade Cida Joias.
          </p>
          
          <div className="pt-4">
            <button className="bg-white text-slate-900 px-8 py-4 rounded-full font-bold hover:bg-amber-600 hover:text-white transition-colors duration-300">
              Explorar Vitrine
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}