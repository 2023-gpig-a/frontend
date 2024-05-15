export interface LLMAPI {
  query(question: string): Promise<{
    llm_response: string
  }>;
}

export const LLM: LLMAPI = {
  async query(question) {
    const res = await fetch(import.meta.env.VITE_LLM_ENDPOINT + "/query_llm", {
      body: JSON.stringify({
        query: question
      }),
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
    });
    return await res.json();
  }
}

export const MockLLM: LLMAPI = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async query(_) {
    return {
      llm_response: "I'm a mock response"
    }
  }
};
