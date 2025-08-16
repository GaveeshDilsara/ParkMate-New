-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 16, 2025 at 08:52 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `parkmate_new`
--

-- --------------------------------------------------------

--
-- Table structure for table `owner_details`
--

CREATE TABLE `owner_details` (
  `id` int(11) NOT NULL,
  `full_name` varchar(200) NOT NULL,
  `contact` varchar(20) NOT NULL,
  `email` varchar(190) NOT NULL,
  `nic` varchar(30) NOT NULL,
  `address` text NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `owner_details`
--

INSERT INTO `owner_details` (`id`, `full_name`, `contact`, `email`, `nic`, `address`, `created_at`) VALUES
(1, 'a', '5431975404', 'a@a.a', 'a', 'a', '2025-08-16 20:33:56'),
(2, 'b', '5131676484', 'b@b.b', 'b', 'b', '2025-08-16 20:35:19'),
(3, 'a', '4345546466', 'hsua@a.a', 'hssh', 'h', '2025-08-16 20:37:37'),
(4, 'z', '5437546495', 'z@z.z', 'z', 'z', '2025-08-16 20:53:20'),
(12, 'h', '5434975454', 'h@h.h', 'hs', 'b', '2025-08-16 21:03:25'),
(13, 'bbb', '8888845454', 'bbb@g.n', 'haus', 'hhs', '2025-08-16 21:26:00'),
(14, 'hsusjd', '5434943164', 'hsus@a.a', 'hsushd', 'bshd', '2025-08-16 21:41:24'),
(15, 'aaaa', '1111111111', 'aaa@a.a', 'hans', 'hs', '2025-08-16 22:42:19'),
(18, 'hsjsj', '5434945454', 'hss@a.ai', 'heus', 'hshd', '2025-08-16 22:43:18'),
(19, 'hoowjs', '5431987504', 'jake@he.js', 'jeos', 'jeos', '2025-08-16 23:39:59'),
(20, 'bzus', '5434646461', 'hsus@jss.hsus', 'hshshd', 'hsjs', '2025-08-16 23:48:50'),
(21, 'hshjd', '5434643618', 'hsudnd@snd.udhd', 'hdjd', 'udud', '2025-08-17 00:03:06'),
(23, 'djsus', '2424543494', 'yshs@dhd.hsd', 'hsusjd', 'sus', '2025-08-17 00:08:58');

-- --------------------------------------------------------

--
-- Table structure for table `parking_agreement`
--

CREATE TABLE `parking_agreement` (
  `id` int(11) NOT NULL,
  `space_id` int(11) DEFAULT NULL,
  `owner_id` int(11) DEFAULT NULL,
  `pdf_path` varchar(500) DEFAULT NULL,
  `images_json` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `parking_agreement`
--

INSERT INTO `parking_agreement` (`id`, `space_id`, `owner_id`, `pdf_path`, `images_json`, `created_at`) VALUES
(1, 1, 1, 'uploads/agreements/1/agreement.pdf', '[\"uploads\\/agreements\\/1\\/img_1.png\"]', '2025-08-16 15:04:18'),
(2, 2, 1, 'uploads/agreements/2/agreement.pdf', '[\"uploads\\/agreements\\/2\\/img_1.png\"]', '2025-08-16 15:05:38'),
(3, 3, 1, 'uploads/agreements/3/agreement.pdf', '[]', '2025-08-16 15:19:00'),
(4, 4, 1, 'uploads/agreements/4/agreement.pdf', '[\"uploads\\/agreements\\/4\\/img_1.png\"]', '2025-08-16 15:23:46'),
(5, 6, 1, 'uploads/agreements/5/agreement.pdf', '[\"uploads\\/agreements\\/5\\/img_1.png\"]', '2025-08-16 15:33:58'),
(6, 9, 1, 'uploads/agreements/6/agreement.pdf', '[\"uploads\\/agreements\\/6\\/img_1.jpg\"]', '2025-08-16 16:12:07');

-- --------------------------------------------------------

--
-- Table structure for table `space_details`
--

CREATE TABLE `space_details` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `address` varchar(255) NOT NULL,
  `location_label` varchar(500) DEFAULT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `availability_json` text DEFAULT NULL,
  `vehicle_counts_json` text DEFAULT NULL,
  `is_free` tinyint(1) NOT NULL DEFAULT 0,
  `price_amount` int(11) DEFAULT NULL,
  `price_unit` enum('hour','day') DEFAULT NULL,
  `pricing_text` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `space_details`
--

INSERT INTO `space_details` (`id`, `name`, `address`, `location_label`, `latitude`, `longitude`, `availability_json`, `vehicle_counts_json`, `is_free`, `price_amount`, `price_unit`, `pricing_text`) VALUES
(8, 'ghhs', 'galle', 'Galle, Galle District, Southern Province, Sri Lanka', 6.0328139, 80.2149550, '[{\"day\":\"Tuesday\",\"start\":\"09:00\",\"end\":\"17:00\"},{\"day\":\"Wednesday\",\"start\":\"09:00\",\"end\":\"17:00\"}]', '{\"Cars\":1,\"Vans\":1,\"Bikes\":1,\"Buses\":2}', 1, NULL, NULL, 'Free'),
(9, 'galle', 'galle', 'Galle, Galle District, Southern Province, Sri Lanka', 6.0328139, 80.2149550, '[{\"day\":\"Thursday\",\"start\":\"09:00\",\"end\":\"17:00\"},{\"day\":\"Friday\",\"start\":\"09:00\",\"end\":\"17:00\"}]', '{\"Cars\":5,\"Vans\":5,\"Bikes\":5,\"Buses\":5}', 0, 40, 'day', 'Rs 40 / day'),
(10, 'jsjs', 'matara', 'Olcott Mawatha, Sarentukade Junction, Weliwatta, Galle, Galle District, Southern Province, 80000, Sri Lanka', 6.0398426, 80.2212729, '[]', '{\"Cars\":0,\"Vans\":0,\"Bikes\":0,\"Buses\":0}', 1, NULL, NULL, 'Free'),
(11, 'bshss', 'matara', 'Matara, Matara District, Southern Province, 81000, Sri Lanka', 5.9478220, 80.5482919, '[{\"day\":\"Tuesday\",\"start\":\"09:00\",\"end\":\"17:00\"},{\"day\":\"Wednesday\",\"start\":\"09:00\",\"end\":\"17:00\"},{\"day\":\"Thursday\",\"start\":\"09:00\",\"end\":\"17:00\"}]', '{\"Cars\":5,\"Vans\":2,\"Buses\":1,\"Bikes\":10}', 0, 60, 'hour', 'Rs 60 / hour'),
(12, 'gshs', 'galle', 'Galle, Galle District, Southern Province, Sri Lanka', 6.0328139, 80.2149550, '[]', '{\"Cars\":4,\"Vans\":1,\"Bikes\":2,\"Buses\":3}', 1, NULL, NULL, 'Free'),
(13, 'hshs', 'galle', 'Galle, Galle District, Southern Province, Sri Lanka', 6.0328139, 80.2149550, '[]', '{\"Cars\":4,\"Vans\":5,\"Bikes\":0,\"Buses\":0}', 0, 50, 'day', 'Rs 50 / day'),
(14, 'gakskd', 'galle', 'Galle, Galle District, Southern Province, Sri Lanka', 6.0328139, 80.2149550, '[{\"day\":\"Tuesday\",\"start\":\"09:00\",\"end\":\"17:00\"},{\"day\":\"Wednesday\",\"start\":\"09:00\",\"end\":\"17:00\"},{\"day\":\"Thursday\",\"start\":\"09:00\",\"end\":\"17:00\"},{\"day\":\"Sunday\",\"start\":\"09:00\",\"end\":\"17:00\"}]', '{\"Cars\":3,\"Vans\":0,\"Bikes\":8,\"Buses\":0}', 0, 40, 'hour', 'Rs 40 / hour'),
(15, 'gshs', 'galle', 'Galle, Galle District, Southern Province, Sri Lanka', 6.0328139, 80.2149550, '[]', '{\"Cars\":0,\"Vans\":0,\"Bikes\":0,\"Buses\":0}', 0, NULL, 'hour', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `space_owners`
--

CREATE TABLE `space_owners` (
  `id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `email` varchar(190) NOT NULL,
  `phone` varchar(30) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `space_owners`
--

INSERT INTO `space_owners` (`id`, `username`, `email`, `phone`, `password_hash`, `created_at`) VALUES
(1, 'a', 'a@a.a', '1', '$2y$10$ceC6kgzCFFEi96rHxuiIGOiGRHS/EiG0x.1WTEMagD.X1nRWv5S4a', '2025-08-16 15:03:25'),
(2, 'b', 'b@b.b', '84', '$2y$10$opo2VdqLSnx7DKeFKi8pXuTiFz7P8fflQwL9LcXrNh8TPVehmiWMO', '2025-08-16 15:31:15');

-- --------------------------------------------------------

--
-- Table structure for table `vehicles`
--

CREATE TABLE `vehicles` (
  `id` int(11) NOT NULL,
  `space_id` int(11) NOT NULL,
  `vehicle_no` varchar(20) NOT NULL,
  `category` enum('Cars','Vans','Bikes','Buses') NOT NULL,
  `phone` varchar(20) NOT NULL,
  `start_time` datetime NOT NULL DEFAULT current_timestamp(),
  `end_time` datetime DEFAULT NULL,
  `status` enum('in','out') NOT NULL DEFAULT 'in',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `vehicles`
--

INSERT INTO `vehicles` (`id`, `space_id`, `vehicle_no`, `category`, `phone`, `start_time`, `end_time`, `status`, `created_at`, `updated_at`) VALUES
(1, 11, 'aaaa', 'Cars', '84246454246', '2025-08-16 20:01:16', '2025-08-16 23:38:19', 'out', '2025-08-16 18:01:17', '2025-08-16 18:08:19'),
(2, 12, 'zzz', 'Buses', '5764946434', '2025-08-16 20:10:55', '2025-08-16 23:41:21', 'out', '2025-08-16 18:10:56', '2025-08-16 18:11:21'),
(3, 12, 'qq', 'Cars', '21218454434', '2025-08-16 20:14:13', '2025-08-16 23:44:28', 'out', '2025-08-16 18:14:13', '2025-08-16 18:14:28'),
(4, 12, 'qq', 'Cars', '414455555', '2025-08-16 20:17:58', NULL, 'in', '2025-08-16 18:17:59', '2025-08-16 18:17:59'),
(5, 13, 'qq', 'Cars', '4444444555', '2025-08-16 20:19:47', '2025-08-16 23:49:53', 'out', '2025-08-16 18:19:48', '2025-08-16 18:19:53'),
(6, 13, 'e', 'Vans', '2584455555', '2025-08-16 20:20:20', '2025-08-16 23:50:29', 'out', '2025-08-16 18:20:21', '2025-08-16 18:20:29'),
(7, 13, 's', 'Cars', '545484545454', '2025-08-16 20:23:59', '2025-08-16 23:54:13', 'out', '2025-08-16 18:24:00', '2025-08-16 18:24:13'),
(8, 13, 'a', 'Cars', '55555555555', '2025-08-16 20:24:54', '2025-08-16 23:55:02', 'out', '2025-08-16 18:24:55', '2025-08-16 18:25:02');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `owner_details`
--
ALTER TABLE `owner_details`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_owner_email` (`email`),
  ADD UNIQUE KEY `uq_owner_nic` (`nic`),
  ADD UNIQUE KEY `uq_owner_contact` (`contact`);

--
-- Indexes for table `parking_agreement`
--
ALTER TABLE `parking_agreement`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `space_details`
--
ALTER TABLE `space_details`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `space_owners`
--
ALTER TABLE `space_owners`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `vehicles`
--
ALTER TABLE `vehicles`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_space_status` (`space_id`,`status`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `owner_details`
--
ALTER TABLE `owner_details`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `parking_agreement`
--
ALTER TABLE `parking_agreement`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `space_details`
--
ALTER TABLE `space_details`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `space_owners`
--
ALTER TABLE `space_owners`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `vehicles`
--
ALTER TABLE `vehicles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `vehicles`
--
ALTER TABLE `vehicles`
  ADD CONSTRAINT `fk_vehicle_space` FOREIGN KEY (`space_id`) REFERENCES `space_details` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
