import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://pxnlesvgcwprpztpkkge.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4bmxlc3ZnY3dwcnB6dHBra2dlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDMxMzExMSwiZXhwIjoyMDk5ODg5MTExfQ.gFp-Png7HGAl13-Hr6xL8EhRiNYXh-dfwUgh5BVMKGQ'
);

async function test() {
  console.log('--- TESTANDO BANCO DE DADOS SUPABASE ---');
  
  console.log('\n[1/2] Testando tabela: contatos');
  const res1 = await supabase.from('contatos').select('id, created_at').limit(2);
  if (res1.error) {
    console.error('ERRO EM contatos:', res1.error);
  } else {
    console.log('SUCESSO! Linhas em contatos:', res1.data);
  }

  console.log('\n[2/2] Testando tabela: site_events');
  const res2 = await supabase.from('site_events').select('visitor_id, event_type').limit(2);
  if (res2.error) {
    console.error('ERRO EM site_events:', res2.error);
  } else {
    console.log('SUCESSO! Linhas em site_events:', res2.data);
  }
}

test();
