"use client";

import { useState, useEffect } from "react";
import { useCompletion } from "@ai-sdk/react";
import { Copy, Check, Sparkles, Wand2, Type, AlignLeft, ClipboardList, BookOpen, Clock, RotateCcw, Trash2, Eye, EyeOff } from "lucide-react";
import { diffWords } from "diff"; 

type HistoryItem = {
  id: number;
  original: string;
  optimized: string;
  mode: string;
};

const options = [
  { id: 'corrigir', label: 'Corrigir Erros', icon: <Wand2 size={16} /> },
  { id: 'formal', label: 'Mais Formal', icon: <Type size={16} /> },
  { id: 'operacional', label: 'Relatório Oper', icon: <ClipboardList size={16} /> },
  { id: 'academico', label: 'Acadêmico', icon: <BookOpen size={16} /> },
  { id: 'expandir', label: 'Expandir', icon: <AlignLeft size={16} /> },
  { id: 'resumir', label: 'Resumir', icon: <AlignLeft size={16} className="rotate-180" /> },
];

export default function Home() {
  const [option, setOption] = useState("corrigir");
  const [isCopied, setIsCopied] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showDiff, setShowDiff] = useState(true);
  
  const [submittedText, setSubmittedText] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
    const savedHistory = localStorage.getItem("text-optimizer-history");
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  const {
    completion,
    setCompletion,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    isLoading
  } = useCompletion({
    api: "/api/completion",
    streamProtocol: "text", 
    body: { option },
    onFinish: (prompt, result) => {
      const newItem: HistoryItem = {
        id: Date.now(),
        original: prompt,
        optimized: result,
        mode: option,
      };
      setHistory((prev) => {
        const newHistory = [newItem, ...prev].slice(0, 5);
        localStorage.setItem("text-optimizer-history", JSON.stringify(newHistory));
        return newHistory;
      });
    }
  });

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    setSubmittedText(input);
    handleSubmit(e);
  };

  const copyToClipboard = (textToCopy: string = completion) => {
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000); 
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("text-optimizer-history");
  };

  const restoreHistoryItem = (item: HistoryItem) => {
    setInput(item.original);
    setSubmittedText(item.original); 
    setCompletion(item.optimized);   
    setOption(item.mode);
  };

  const getStats = (text: string) => {
    if (!text) return { words: 0, chars: 0 };
    const words = text.trim().split(/\s+/).filter((word) => word.length > 0).length;
    return { words, chars: text.length };
  };

  const renderDiff = (originalText: string, newText: string) => {
    if (!newText) return null;
    
    const differences = diffWords(originalText, newText);
    
    return differences.map((part, index) => {
      if (part.added) {
        return (
          <span key={index} className="bg-green-100 text-green-800 rounded-sm px-0.5 mx-0.5">
            {part.value}
          </span>
        );
      }
      if (part.removed) {
        return (
          <span key={index} className="bg-red-100 text-red-600 line-through rounded-sm px-0.5 mx-0.5 opacity-70">
            {part.value}
          </span>
        );
      }
      return <span key={index}>{part.value}</span>;
    });
  };

  const inputStats = getStats(input);
  // outputStats removido por não ser utilizado

  if (!isMounted) return <div className="min-h-screen bg-slate-50"></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800 flex flex-col justify-between">
      <main className="max-w-5xl w-full mx-auto space-y-8 flex-1">
        
        {/* Cabeçalho */}
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white shadow-md">
            <Sparkles size={24} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Otimizador de Texto</h1>
            <p className="text-slate-500 text-sm">Ajuste e melhore seus textos em segundos com IA</p>
          </div>
        </div>

        {/* Barra de Modos */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {options.map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => setOption(mode.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                option === mode.id
                  ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {mode.icon}
              {mode.label}
            </button>
          ))}
        </div>

        {/* Área de Texto */}
        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6" suppressHydrationWarning>
          {/* Coluna 1: Input Original */}
          <div className="flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex justify-between items-center">
              <label htmlFor="original-text" className="text-sm font-semibold text-slate-700">Texto Original</label>
              <span className="text-xs text-slate-400 font-medium">
                {inputStats.words} palavras | {inputStats.chars} caracteres
              </span>
            </div>
            <textarea
              id="original-text"
              className="w-full h-80 p-4 focus:ring-0 outline-none resize-none text-slate-700 bg-transparent leading-relaxed"
              placeholder="Cole ou digite seu texto aqui..."
              value={input}
              onChange={handleInputChange}
            />
            <div className="p-3 border-t border-slate-100 bg-white">
              <button
                type="submit"
                disabled={isLoading || !input}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg disabled:opacity-50 transition-colors flex justify-center items-center gap-2 shadow-sm"
              >
                {isLoading ? (
                  <span className="animate-pulse">Processando...</span>
                ) : (
                  <>Otimizar Texto <Sparkles size={18} /></>
                )}
              </button>
            </div>
          </div>

          {/* Coluna 2: Output da IA */}
          <div className="flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden relative">
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex justify-between items-center">
              <label htmlFor="optimized-text" className="text-sm font-semibold text-slate-700">Texto Otimizado</label>
              
              <div className="flex items-center gap-2 md:gap-4">
                {completion && (
                  <button
                    type="button"
                    onClick={() => setShowDiff(!showDiff)}
                    className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md transition-colors text-blue-600 bg-blue-50 hover:bg-blue-100"
                  >
                    {showDiff ? <EyeOff size={14} /> : <Eye size={14} />}
                    <span className="hidden sm:inline">{showDiff ? "Ocultar Alterações" : "Ver Alterações"}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => copyToClipboard(completion)}
                  disabled={!completion}
                  className="text-slate-500 hover:text-slate-800 disabled:opacity-30 transition-colors flex items-center gap-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-md"
                  title="Copiar texto limpo"
                >
                  {isCopied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                  <span className="hidden sm:inline">{isCopied ? "Copiado!" : "Copiar"}</span>
                </button>
              </div>
            </div>
            
            <div 
              id="optimized-text"
              className="w-full h-full min-h-[320px] p-4 overflow-y-auto whitespace-pre-wrap text-slate-700 bg-transparent leading-relaxed"
            >
              {completion ? (
                showDiff && !isLoading ? renderDiff(submittedText, completion) : completion
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm text-center px-8">
                  O resultado otimizado aparecerá aqui em tempo real...
                </div>
              )}
            </div>
          </div>
        </form>

        {/* Histórico Recente */}
        {history.length > 0 && (
          <div className="pt-6 border-t border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Clock size={18} className="text-blue-600" />
                Histórico Recente
              </h2>
              <button onClick={clearHistory} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
                <Trash2 size={14} /> Limpar
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {history.map((item) => (
                <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-600 rounded-md capitalize">
                      {item.mode}
                    </span>
                    <div className="flex gap-2">
                      <button onClick={() => restoreHistoryItem(item)} className="text-slate-400 hover:text-blue-600" title="Restaurar texto original">
                        <RotateCcw size={16} />
                      </button>
                      <button onClick={() => copyToClipboard(item.optimized)} className="text-slate-400 hover:text-blue-600" title="Copiar texto otimizado">
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 line-clamp-3">
                    {item.optimized}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer Adicionado */}
      <footer className="max-w-5xl w-full mx-auto mt-12 pt-6 pb-2 border-t border-slate-200 text-center text-sm text-slate-500">
        <p>
          &copy; {new Date().getFullYear()} Todos os direitos reservados. Desenvolvido por :{" "}
          <a 
            href="https://www.linkedin.com/in/richard-lapuente/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="font-semibold text-blue-600 hover:text-blue-800 transition-colors"
          >
            Richard Lapuente
          </a>
        </p>
      </footer>
    </div>
  );
}