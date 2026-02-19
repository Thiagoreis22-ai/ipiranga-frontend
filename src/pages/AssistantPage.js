import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { ScrollArea } from "../components/ui/scroll-area";
import { toast } from "sonner";
import {
  Send,
  Bot,
  User,
  AlertTriangle,
  CheckCircle,
  Clock,
  Sparkles,
  Lightbulb,
} from "lucide-react";
import { cn, getRiskColor } from "../lib/utils";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const quickSuggestions = [
  "pH caiu para 6.4 e turbidez aumentou",
  "Temperatura do caldo está abaixo de 100°C",
  "Floculante não está tendo efeito esperado",
  "Brix acima de 20, devo ajustar dosagem?",
  "Como melhorar a clarificação do caldo?",
];

export default function AssistantPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (text) => {
    if (!text.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/chat`, {
        message: text,
        session_id: sessionId,
      });

      const aiMessage = {
        id: Date.now() + 1,
        type: "ai",
        content: response.data.response,
        risk_level: response.data.risk_level,
        escalate: response.data.escalate,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      setSessionId(response.data.session_id);

      if (response.data.escalate) {
        toast.warning("Recomendação: Acionar supervisão", {
          description: "A situação requer atenção do supervisor.",
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Erro ao enviar mensagem");
      
      const errorMessage = {
        id: Date.now() + 1,
        type: "ai",
        content: "Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.",
        risk_level: "MÉDIO",
        escalate: false,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div data-testid="assistant-page" className="h-full flex flex-col">
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight">
              Assistente IA
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Suporte inteligente para operações de tratamento
            </p>
          </div>
          <Badge variant="outline" className="gap-2">
            <Sparkles className="w-4 h-4" />
            GPT-5.2 Ativo
          </Badge>
        </div>
      </div>

      <div className="flex-1 flex gap-6 p-6 min-h-0">
        {/* Chat Area */}
        <Card className="flex-1 flex flex-col min-h-0">
          <CardHeader className="border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-sm bg-primary flex items-center justify-center">
                <Bot className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-lg">IPIRANGA AI Assistant</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Especialista em Tratamento de Caldo
                </p>
              </div>
            </div>
          </CardHeader>

          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-md bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Lightbulb className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold mb-2">
                    Como posso ajudar?
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Descreva a situação operacional e receba análise técnica com
                    causa provável, ações recomendadas e nível de risco.
                  </p>
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "chat-message",
                    msg.type === "user" ? "chat-message-user" : "chat-message-ai"
                  )}
                  data-testid={`chat-message-${msg.type}`}
                >
                  <div className="flex items-start gap-3">
                    {msg.type === "ai" && (
                      <div className="w-8 h-8 rounded-sm bg-background/20 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium">
                          {msg.type === "user" ? "Você" : "IPIRANGA AI"}
                        </span>
                        <span className="text-xs opacity-70">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {new Date(msg.timestamp).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      {msg.type === "ai" && msg.risk_level && (
                        <div className="flex items-center gap-2 mt-3">
                          <Badge
                            variant="outline"
                            className={cn("text-xs", getRiskColor(msg.risk_level))}
                          >
                            Risco: {msg.risk_level}
                          </Badge>
                          {msg.escalate && (
                            <Badge variant="outline" className="text-xs status-warning gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Acionar Supervisão
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    {msg.type === "user" && (
                      <div className="w-8 h-8 rounded-sm bg-background/20 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="chat-message chat-message-ai">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-sm bg-background/20 flex items-center justify-center">
                      <Bot className="w-4 h-4 animate-pulse" />
                    </div>
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <CardContent className="border-t border-border pt-4">
            <form onSubmit={handleSubmit} className="flex gap-3">
              <Input
                placeholder="Descreva a situação operacional..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                className="flex-1"
                data-testid="chat-input"
              />
              <Button type="submit" disabled={loading || !input.trim()} data-testid="chat-send">
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Quick Suggestions Sidebar */}
        <div className="w-80 space-y-4 hidden lg:block">
          <Card>
            <CardHeader>
              <CardTitle className="card-title-industrial flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                Sugestões Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickSuggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-3 text-sm"
                  onClick={() => sendMessage(suggestion)}
                  disabled={loading}
                  data-testid={`suggestion-${index}`}
                >
                  {suggestion}
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="card-title-industrial">
                Sobre o Assistente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5" />
                <span>Analisa parâmetros do caldo</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5" />
                <span>Identifica causas prováveis</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5" />
                <span>Sugere ações corretivas</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5" />
                <span>Classifica nível de risco</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5" />
                <span>Indica quando escalar</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
