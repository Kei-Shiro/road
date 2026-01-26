-- Script d'initialisation de la base de données PostgreSQL
-- Road Signaling Application - Antananarivo

-- Créer la base de données si elle n'existe pas
-- CREATE DATABASE road_db;

-- Insertion d'un utilisateur Manager par défaut
-- Mot de passe: manager123 (encodé avec BCrypt)
INSERT INTO users (email, password, nom, prenom, telephone, role, login_attempts, is_locked, is_online, is_active, created_at, updated_at)
VALUES (
    'manager@road.mg',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGJzfGbhLjQ9vCxG4IpZkHfVpGRy',
    'Admin',
    'Manager',
    '+261 34 00 000 00',
    'MANAGER',
    0,
    false,
    false,
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Insertion d'un utilisateur standard par défaut
-- Mot de passe: user123 (encodé avec BCrypt)
INSERT INTO users (email, password, nom, prenom, telephone, role, login_attempts, is_locked, is_online, is_active, created_at, updated_at)
VALUES (
    'user@road.mg',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGJzfGbhLjQ9vCxG4IpZkHfVpGRy',
    'Utilisateur',
    'Test',
    '+261 34 00 000 01',
    'UTILISATEUR',
    0,
    false,
    false,
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Insertion de signalements de démonstration
INSERT INTO signalements (titre, description, latitude, longitude, adresse, statut, surface_impactee, budget, entreprise_responsable, date_debut, date_fin_prevue, pourcentage_avancement, priorite, type, sync_id, is_synced, is_active, created_at, updated_at)
VALUES
(
    'Réparation Route Analakely',
    'Travaux de réparation de la chaussée principale au centre-ville',
    -18.9149,
    47.5236,
    'Avenue de l''Indépendance, Analakely',
    'EN_COURS',
    500.00,
    50000000.00,
    'Madagascar TP',
    '2026-01-15',
    '2026-03-15',
    35,
    'HAUTE',
    'REPARATION',
    'demo-sig-001',
    true,
    true,
    NOW(),
    NOW()
),
(
    'Extension Route Ivandry',
    'Élargissement de la voie principale vers Ivandry',
    -18.8826,
    47.5303,
    'Route d''Ivandry',
    'NOUVEAU',
    1200.00,
    150000000.00,
    'COLAS Madagascar',
    NULL,
    '2026-06-30',
    0,
    'MOYENNE',
    'EXTENSION',
    'demo-sig-002',
    true,
    true,
    NOW(),
    NOW()
),
(
    'Entretien Tunnel Ambohidahy',
    'Maintenance préventive du tunnel routier',
    -18.9089,
    47.5167,
    'Tunnel Ambohidahy',
    'TERMINE',
    200.00,
    25000000.00,
    'SOGEA',
    '2025-11-01',
    '2025-12-31',
    100,
    'URGENTE',
    'ENTRETIEN',
    'demo-sig-003',
    true,
    true,
    NOW(),
    NOW()
),
(
    'Construction Pont Anosibe',
    'Nouveau pont pour désengorger la circulation',
    -18.9234,
    47.5089,
    'Anosibe, Antananarivo',
    'EN_COURS',
    800.00,
    500000000.00,
    'EIFFAGE Madagascar',
    '2025-06-01',
    '2026-12-31',
    60,
    'HAUTE',
    'CONSTRUCTION',
    'demo-sig-004',
    true,
    true,
    NOW(),
    NOW()
),
(
    'Réparation Nids de poule Mahamasina',
    'Réparation des nids de poule sur la route du stade',
    -18.9203,
    47.5201,
    'Avenue Mahamasina',
    'NOUVEAU',
    150.00,
    10000000.00,
    NULL,
    NULL,
    NULL,
    0,
    'BASSE',
    'REPARATION',
    'demo-sig-005',
    true,
    true,
    NOW(),
    NOW()
);

