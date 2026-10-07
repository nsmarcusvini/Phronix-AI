-- Índice que cobre a FK composta reviews (qa_item_id, kit_id) → qa_items,
-- usado no delete em cascata das respostas (aviso do advisor de performance).
create index reviews_qa_item_id_kit_id_idx on public.reviews (qa_item_id, kit_id);
