-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 16, 2025 at 10:50 PM
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
(15, 'gshs', 'galle', 'Galle, Galle District, Southern Province, Sri Lanka', 6.0328139, 80.2149550, '[]', '{\"Cars\":0,\"Vans\":0,\"Bikes\":0,\"Buses\":0}', 0, NULL, 'hour', NULL),
(16, 'a', 'galle', 'Galle, Galle District, Southern Province, Sri Lanka', 6.0328139, 80.2149550, '[]', '{\"Cars\":5,\"Vans\":0,\"Bikes\":0,\"Buses\":0}', 0, 30, 'hour', 'Rs 30 / hour');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `space_details`
--
ALTER TABLE `space_details`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `space_details`
--
ALTER TABLE `space_details`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
