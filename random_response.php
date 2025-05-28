<?php
// Устанавливаем заголовки для JSON-ответа
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Генерируем случайную задержку от 1 до 5 секунд
$delay = rand(1, 5);
sleep($delay);

// Генерируем случайное число от 1 до 100
$randomValue = rand(1, 100);

// Формируем ответ
$response = [
    'value' => $randomValue,
    'delay' => $delay,
    'timestamp' => date('Y-m-d H:i:s')
];

// Отправляем ответ в формате JSON
echo json_encode($response, JSON_PRETTY_PRINT);
?> 