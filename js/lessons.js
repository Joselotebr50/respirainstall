// js/lessons.js
const lessons = [
  { title: 'Conhecendo seus gatilhos', content: 'Identifique o que te leva a fumar.' },
  { title: 'Respiração 4-7-8', content: 'Inspire 4s, segure 7s, expire 8s.' },
  { title: 'Desarmando o ambiente', content: 'Jogue fora cinzeiros e isqueiros.' },
  { title: 'Plano Se... Então...', content: 'Crie planos para cada gatilho.' },
  { title: 'Fissura passa em 5 min', content: 'A fissura é como uma onda, ela passa.' },
  { title: 'Recompensas sem cigarro', content: 'Use o dinheiro economizado.' },
  { title: 'Mitos sobre fumar', content: 'Fumar não acalma, vicia.' },
  { title: 'Prevenção de recaída', content: 'Planeje situações de risco.' },
];

export function carregarLessons() {
  const container = document.getElementById('lessons-list');
  container.innerHTML = lessons.map((l, i) =>
    `<div class="card" onclick="alert('${l.content}')"><strong>${i+1}. ${l.title}</strong></div>`
  ).join('');
}