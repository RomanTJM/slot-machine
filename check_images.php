<?php
header('Content-Type: text/plain');

$images = [
    'cherry.png',
    'lemon.png',
    'orange.png',
    'plum.png',
    'bell.png',
    'bar.png',
    'seven.png',
    'diamond.png'
];

echo "Проверка изображений:\n\n";

foreach ($images as $image) {
    $path = './images/' . $image;
    if (file_exists($path)) {
        echo "$image: OK (размер: " . filesize($path) . " байт)\n";
    } else {
        echo "$image: ОТСУТСТВУЕТ\n";
    }
}

echo "\nТекущая директория: " . getcwd() . "\n";
echo "Содержимое папки images:\n";
if (is_dir('./images')) {
    $files = scandir('./images');
    print_r($files);
} else {
    echo "Папка images не существует\n";
}
?> 