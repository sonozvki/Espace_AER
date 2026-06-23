export type Memo = {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateMemoInput = {
  title: string;
  content: string;
};
