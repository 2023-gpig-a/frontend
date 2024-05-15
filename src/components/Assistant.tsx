import { useMutation } from "@tanstack/react-query";
import { LLM, MockLLM } from "../api/llm";
import { useReducer, useState } from "react";
import { twMerge } from "tailwind-merge";
import Icon from "./AssistantIcon.png";

const api = import.meta.env.VITE_USE_MOCK_LLM === "true" ? MockLLM : LLM;

interface Line {
  text: string;
  speaker: "user" | "agent" | "system";
}

function linesReducer(state: Line[], line: Line) {
  return [...state, line];
}

function AssistantCore() {
  const query = useMutation({
    mutationFn: (question: string) => api.query(question),
  });
  const [lines, addLine] = useReducer(linesReducer, [
    {
      text: "Hello! I'm your assistant. How can I help you with your forest management problems today?",
      speaker: "system",
    },
  ]);

  return (
    <div className="flex flex-col h-full m-8 relative">
      <div className="flex-1 overflow-y-auto space-y-2">
        {lines.map((line, i) => (
          <div
            key={i}
            className={twMerge(
              "text-whit rounded-md px-4 py-2 text-white shadow-sm",
              line.speaker === "user"
                ? "text-right bg-green-900"
                : line.speaker === "system"
                ? "text-center bg-cyan-900"
                : "text-left bg-blue-900"
            )}
          >
            {line.text}
          </div>
        ))}
        {query.isPending && (
          <div className="text-white text-center">Thinking...</div>
        )}
      </div>
      <div className="flex">
        <input
          type="text"
          className="flex-1 p-2 rounded-sm"
          placeholder="Ask me anything..."
          onKeyUp={(e) => {
            if (e.key === "Enter") {
              const v = e.currentTarget.value;
              query.mutate(v);
              addLine({
                text: v,
                speaker: "user",
              });
              query.mutate(v, {
                onSuccess: (data) => {
                  addLine({
                    text: data.llm_response,
                    speaker: "agent",
                  });
                },
              });
              e.currentTarget.value = "";
            }
          }}
        />
      </div>
    </div>
  );
}

export function Assistant() {
  const [isOpen, setOpen] = useState(false);

  return (
    <div
      className={twMerge(
        "fixed bottom-8 right-8 bg-green-700 transition-all duration-700 ease-in-out",
        isOpen
          ? "w-96 h-5/6 rounded-sm z-[40] shadow-xl"
          : "w-16 h-16 rounded-full flex items-center justify-center shadow-md"
      )}
    >
      {isOpen ? (
        <div className="flex flex-col h-full">
          <AssistantCore />
          <button
            className="top-2 right-2 p-2 absolute z-50"
            onClick={() => {
              setOpen(false);
            }}
          >
            &times;
          </button>
        </div>
      ) : (
        <img
          src={Icon}
          alt=""
          className="w-10 h-10"
          onClick={() => setOpen(true)}
        />
      )}
    </div>
  );
}
