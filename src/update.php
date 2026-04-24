<?php

$pdo = new PDO('mysql:host=mysql;port=3306;dbname=db_cluster_1', 'root', 'root_pharma_2024');
$hash = password_hash('password', PASSWORD_DEFAULT);
$pdo->prepare('UPDATE usuarios SET password_hash=? WHERE email=?')->execute([$hash, 'admin@pharmaquick.com']);
print_r($pdo->lastInsertId());