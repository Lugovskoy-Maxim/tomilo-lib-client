// Тест функциональности статистики рейтингов

// Пример данных рейтингов как описано в задаче
const testRatings = [10, 9, 8, 10, 9, 10, 8, 9, 7, 10, 9, 8, 10, 9, 8, 7, 10, 9];

// Функция обработки массива оценок и подсчета частоты каждой оценки
function getRatingStats(ratings: number[]) {
  const stats = ratings.reduce((acc, rating) => {
    acc[rating] = (acc[rating] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  // Сортируем по убыванию оценки
  return Object.entries(stats)
    .map(([rating, count]) => ({
      rating: parseInt(rating),
      count,
      percentage: (count / ratings.length * 100).toFixed(1)
    }))
    .sort((a, b) => b.rating - a.rating);
}

console.log("Исходные данные:", testRatings);
console.log("Общее количество оценок:", testRatings.length);
console.log("\nСтатистика рейтингов:");

const stats = getRatingStats(testRatings);
stats.forEach(stat => {
  console.log(`${stat.rating} - ${stat.count} шт (${stat.percentage}%)`);
});

// Тест с пустым массивом
console.log("\nТест с пустым массивом:", getRatingStats([]));

// Тест с одним типом оценок
console.log("\nТест с одним типом оценок:", getRatingStats([10, 10, 10]));

// Пример того, как это будет отображаться в UI:
console.log("\nПример отображения в UI:");
console.log("Всего оценок: " + testRatings.length);
console.log("Распределение оценок:");
stats.forEach(stat => {
  console.log(`  ${stat.rating} ★ - ${stat.count} шт (${stat.percentage}%)`);
});
