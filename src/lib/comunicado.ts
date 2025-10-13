// Campo utilitário para comunicados
export type Comunicado = {
  id: string;
  titulo: string;
  mensagem: string;
  data: string;
  autor?: string;
};

// Exemplo de uso:
// import { Comunicado } from './comunicado';
// const novoComunicado: Comunicado = { ... };
