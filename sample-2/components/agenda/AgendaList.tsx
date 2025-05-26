import React, { useEffect } from "react";
import { toast } from "react-hot-toast";

// 아젠다 실행 이벤트 구독
useEffect(() => {
  const handleAgendaExecuted = (event: CustomEvent<{ agendaId: number }>) => {
    // 아젠다 목록 갱신
    refreshAgendas();
    // 성공 메시지 표시
    toast.success("Agenda executed successfully!");
  };

  window.addEventListener(
    "agendaExecuted",
    handleAgendaExecuted as EventListener
  );

  return () => {
    window.removeEventListener(
      "agendaExecuted",
      handleAgendaExecuted as EventListener
    );
  };
}, [refreshAgendas]);
