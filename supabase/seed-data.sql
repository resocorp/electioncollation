-- Seed Data for Anambra State Election
-- This file contains sample polling unit agents for testing

-- Sample Agents for Anambra State (21 LGAs)
-- Format: phone_number, name, polling_unit_code, ward, lga

INSERT INTO agents (phone_number, name, polling_unit_code, ward, lga, state, role, status) VALUES
  -- Aguata LGA
  ('2348011111101', 'Chukwudi Okafor', 'PU001AG', 'Aguata I', 'Aguata', 'Anambra', 'pu_agent', 'active'),
  ('2348011111102', 'Ngozi Eze', 'PU002AG', 'Aguata I', 'Aguata', 'Anambra', 'pu_agent', 'active'),
  ('2348011111103', 'Emeka Nwankwo', 'PU003AG', 'Aguata II', 'Aguata', 'Anambra', 'pu_agent', 'active'),
  ('2348011111104', 'Chioma Okeke', 'PU004AG', 'Aguata II', 'Aguata', 'Anambra', 'pu_agent', 'active'),
  ('2348011111105', 'Ikechukwu Okoli', 'PU005AG', 'Aguata III', 'Aguata', 'Anambra', 'pu_agent', 'active'),
  
  -- Awka North LGA
  ('2348011111201', 'Obiora Udoka', 'PU001AN', 'Amansea', 'Awka North', 'Anambra', 'pu_agent', 'active'),
  ('2348011111202', 'Ada Okonkwo', 'PU002AN', 'Amansea', 'Awka North', 'Anambra', 'pu_agent', 'active'),
  ('2348011111203', 'Chinedu Obi', 'PU003AN', 'Achalla', 'Awka North', 'Anambra', 'pu_agent', 'active'),
  ('2348011111204', 'Uchenna Nnamani', 'PU004AN', 'Achalla', 'Awka North', 'Anambra', 'pu_agent', 'active'),
  ('2348011111205', 'Ifeanyi Okoye', 'PU005AN', 'Ebenebe', 'Awka North', 'Anambra', 'pu_agent', 'active'),
  
  -- Awka South LGA
  ('2348011111301', 'Nkechi Chukwu', 'PU001AS', 'Awka I', 'Awka South', 'Anambra', 'pu_agent', 'active'),
  ('2348011111302', 'Kelechi Nnadi', 'PU002AS', 'Awka I', 'Awka South', 'Anambra', 'pu_agent', 'active'),
  ('2348011111303', 'Oluchi Mbah', 'PU003AS', 'Awka II', 'Awka South', 'Anambra', 'pu_agent', 'active'),
  ('2348011111304', 'Obinna Okafor', 'PU004AS', 'Awka II', 'Awka South', 'Anambra', 'pu_agent', 'active'),
  ('2348011111305', 'Adaeze Okoli', 'PU005AS', 'Nibo', 'Awka South', 'Anambra', 'pu_agent', 'active'),
  
  -- Anambra East LGA
  ('2348011111401', 'Chika Onwurah', 'PU001AE', 'Nando', 'Anambra East', 'Anambra', 'pu_agent', 'active'),
  ('2348011111402', 'Tochukwu Okoro', 'PU002AE', 'Nando', 'Anambra East', 'Anambra', 'pu_agent', 'active'),
  ('2348011111403', 'Amarachi Eze', 'PU003AE', 'Otuocha', 'Anambra East', 'Anambra', 'pu_agent', 'active'),
  ('2348011111404', 'Chibuzor Nweke', 'PU004AE', 'Otuocha', 'Anambra East', 'Anambra', 'pu_agent', 'active'),
  ('2348011111405', 'Chinonso Okonkwo', 'PU005AE', 'Umueri', 'Anambra East', 'Anambra', 'pu_agent', 'active'),
  
  -- Anambra West LGA
  ('2348011111501', 'Ebuka Udoh', 'PU001AW', 'Nzam', 'Anambra West', 'Anambra', 'pu_agent', 'active'),
  ('2348011111502', 'Chiamaka Obi', 'PU002AW', 'Nzam', 'Anambra West', 'Anambra', 'pu_agent', 'active'),
  ('2348011111503', 'Uzochukwu Ike', 'PU003AW', 'Umuenwelum', 'Anambra West', 'Anambra', 'pu_agent', 'active'),
  ('2348011111504', 'Ifeoma Okafor', 'PU004AW', 'Umuenwelum', 'Anambra West', 'Anambra', 'pu_agent', 'active'),
  ('2348011111505', 'Chidubem Okeke', 'PU005AW', 'Ezi-Anam', 'Anambra West', 'Anambra', 'pu_agent', 'active'),
  
  -- Anaocha LGA
  ('2348011111601', 'Nnamdi Ezeani', 'PU001AC', 'Neni', 'Anaocha', 'Anambra', 'pu_agent', 'active'),
  ('2348011111602', 'Chidinma Nwankwo', 'PU002AC', 'Neni', 'Anaocha', 'Anambra', 'pu_agent', 'active'),
  ('2348011111603', 'Kenechukwu Ude', 'PU003AC', 'Adazi-Nnukwu', 'Anaocha', 'Anambra', 'pu_agent', 'active'),
  ('2348011111604', 'Blessing Okoye', 'PU004AC', 'Adazi-Nnukwu', 'Anaocha', 'Anambra', 'pu_agent', 'active'),
  ('2348011111605', 'Chukwuemeka Okoro', 'PU005AC', 'Agulu', 'Anaocha', 'Anambra', 'pu_agent', 'active'),
  
  -- Ayamelum LGA
  ('2348011111701', 'Onyekachi Nnaji', 'PU001AY', 'Anaku', 'Ayamelum', 'Anambra', 'pu_agent', 'active'),
  ('2348011111702', 'Mmesoma Okonkwo', 'PU002AY', 'Anaku', 'Ayamelum', 'Anambra', 'pu_agent', 'active'),
  ('2348011111703', 'Chukwuebuka Obi', 'PU003AY', 'Ifite-Ogwari', 'Ayamelum', 'Anambra', 'pu_agent', 'active'),
  ('2348011111704', 'Nnenna Okeke', 'PU004AY', 'Ifite-Ogwari', 'Ayamelum', 'Anambra', 'pu_agent', 'active'),
  ('2348011111705', 'Somtochukwu Eze', 'PU005AY', 'Omor', 'Ayamelum', 'Anambra', 'pu_agent', 'active'),
  
  -- Dunukofia LGA
  ('2348011111801', 'Chukwudi Nwachukwu', 'PU001DK', 'Ukpo', 'Dunukofia', 'Anambra', 'pu_agent', 'active'),
  ('2348011111802', 'Chinenye Okafor', 'PU002DK', 'Ukpo', 'Dunukofia', 'Anambra', 'pu_agent', 'active'),
  ('2348011111803', 'Chinedu Okoli', 'PU003DK', 'Umunnachi', 'Dunukofia', 'Anambra', 'pu_agent', 'active'),
  ('2348011111804', 'Ugochi Okoro', 'PU004DK', 'Umunnachi', 'Dunukofia', 'Anambra', 'pu_agent', 'active'),
  ('2348011111805', 'Obinna Eze', 'PU005DK', 'Ukwulu', 'Dunukofia', 'Anambra', 'pu_agent', 'active'),
  
  -- Ekwusigo LGA
  ('2348011111901', 'Kamsi Okonkwo', 'PU001EK', 'Ozubulu', 'Ekwusigo', 'Anambra', 'pu_agent', 'active'),
  ('2348011111902', 'Chiamaka Nwankwo', 'PU002EK', 'Ozubulu', 'Ekwusigo', 'Anambra', 'pu_agent', 'active'),
  ('2348011111903', 'Chukwuma Obi', 'PU003EK', 'Ihembosi', 'Ekwusigo', 'Anambra', 'pu_agent', 'active'),
  ('2348011111904', 'Adaora Okeke', 'PU004EK', 'Ihembosi', 'Ekwusigo', 'Anambra', 'pu_agent', 'active'),
  ('2348011111905', 'Ifeanyi Udoka', 'PU005EK', 'Oraifite', 'Ekwusigo', 'Anambra', 'pu_agent', 'active'),
  
  -- Idemili North LGA
  ('2348011112001', 'Emeka Okafor', 'PU001IN', 'Ogidi', 'Idemili North', 'Anambra', 'pu_agent', 'active'),
  ('2348011112002', 'Ngozi Okoli', 'PU002IN', 'Ogidi', 'Idemili North', 'Anambra', 'pu_agent', 'active'),
  ('2348011112003', 'Chinedu Okoro', 'PU003IN', 'Abatete', 'Idemili North', 'Anambra', 'pu_agent', 'active'),
  ('2348011112004', 'Chioma Eze', 'PU004IN', 'Abatete', 'Idemili North', 'Anambra', 'pu_agent', 'active'),
  ('2348011112005', 'Ikechukwu Nwankwo', 'PU005IN', 'Oraukwu', 'Idemili North', 'Anambra', 'pu_agent', 'active'),
  
  -- Idemili South LGA
  ('2348011112101', 'Obiora Okonkwo', 'PU001IS', 'Nnokwa', 'Idemili South', 'Anambra', 'pu_agent', 'active'),
  ('2348011112102', 'Ada Obi', 'PU002IS', 'Nnokwa', 'Idemili South', 'Anambra', 'pu_agent', 'active'),
  ('2348011112103', 'Chukwudi Okeke', 'PU003IS', 'Ojoto', 'Idemili South', 'Anambra', 'pu_agent', 'active'),
  ('2348011112104', 'Uchenna Udoka', 'PU004IS', 'Ojoto', 'Idemili South', 'Anambra', 'pu_agent', 'active'),
  ('2348011112105', 'Ifeanyi Okafor', 'PU005IS', 'Akwa-Ukwu', 'Idemili South', 'Anambra', 'pu_agent', 'active'),
  
  -- Ihiala LGA
  ('2348011112201', 'Nkechi Okoli', 'PU001IH', 'Ihiala I', 'Ihiala', 'Anambra', 'pu_agent', 'active'),
  ('2348011112202', 'Kelechi Okoro', 'PU002IH', 'Ihiala I', 'Ihiala', 'Anambra', 'pu_agent', 'active'),
  ('2348011112203', 'Oluchi Eze', 'PU003IH', 'Ihiala II', 'Ihiala', 'Anambra', 'pu_agent', 'active'),
  ('2348011112204', 'Obinna Nwankwo', 'PU004IH', 'Ihiala II', 'Ihiala', 'Anambra', 'pu_agent', 'active'),
  ('2348011112205', 'Adaeze Okonkwo', 'PU005IH', 'Mbosi', 'Ihiala', 'Anambra', 'pu_agent', 'active'),
  
  -- Njikoka LGA
  ('2348011112301', 'Chika Obi', 'PU001NJ', 'Abagana', 'Njikoka', 'Anambra', 'pu_agent', 'active'),
  ('2348011112302', 'Tochukwu Okeke', 'PU002NJ', 'Abagana', 'Njikoka', 'Anambra', 'pu_agent', 'active'),
  ('2348011112303', 'Amarachi Udoka', 'PU003NJ', 'Nimo', 'Njikoka', 'Anambra', 'pu_agent', 'active'),
  ('2348011112304', 'Chibuzor Okafor', 'PU004NJ', 'Nimo', 'Njikoka', 'Anambra', 'pu_agent', 'active'),
  ('2348011112305', 'Chinonso Okoli', 'PU005NJ', 'Enugwu-Ukwu', 'Njikoka', 'Anambra', 'pu_agent', 'active'),
  
  -- Nnewi North LGA
  ('2348011112401', 'Ebuka Okoro', 'PU001NN', 'Nnewi I', 'Nnewi North', 'Anambra', 'pu_agent', 'active'),
  ('2348011112402', 'Chiamaka Eze', 'PU002NN', 'Nnewi I', 'Nnewi North', 'Anambra', 'pu_agent', 'active'),
  ('2348011112403', 'Uzochukwu Nwankwo', 'PU003NN', 'Nnewi II', 'Nnewi North', 'Anambra', 'pu_agent', 'active'),
  ('2348011112404', 'Ifeoma Okonkwo', 'PU004NN', 'Nnewi II', 'Nnewi North', 'Anambra', 'pu_agent', 'active'),
  ('2348011112405', 'Chidubem Obi', 'PU005NN', 'Uruagu', 'Nnewi North', 'Anambra', 'pu_agent', 'active'),
  
  -- Nnewi South LGA
  ('2348011112501', 'Nnamdi Okeke', 'PU001NS', 'Ukpor', 'Nnewi South', 'Anambra', 'pu_agent', 'active'),
  ('2348011112502', 'Chidinma Udoka', 'PU002NS', 'Ukpor', 'Nnewi South', 'Anambra', 'pu_agent', 'active'),
  ('2348011112503', 'Kenechukwu Okafor', 'PU003NS', 'Unubi', 'Nnewi South', 'Anambra', 'pu_agent', 'active'),
  ('2348011112504', 'Blessing Okoli', 'PU004NS', 'Unubi', 'Nnewi South', 'Anambra', 'pu_agent', 'active'),
  ('2348011112505', 'Chukwuemeka Okoro', 'PU005NS', 'Azigbo', 'Nnewi South', 'Anambra', 'pu_agent', 'active'),
  
  -- Ogbaru LGA
  ('2348011112601', 'Onyekachi Eze', 'PU001OG', 'Atani', 'Ogbaru', 'Anambra', 'pu_agent', 'active'),
  ('2348011112602', 'Mmesoma Nwankwo', 'PU002OG', 'Atani', 'Ogbaru', 'Anambra', 'pu_agent', 'active'),
  ('2348011112603', 'Chukwuebuka Okonkwo', 'PU003OG', 'Okpoko', 'Ogbaru', 'Anambra', 'pu_agent', 'active'),
  ('2348011112604', 'Nnenna Obi', 'PU004OG', 'Okpoko', 'Ogbaru', 'Anambra', 'pu_agent', 'active'),
  ('2348011112605', 'Somtochukwu Okeke', 'PU005OG', 'Ossomala', 'Ogbaru', 'Anambra', 'pu_agent', 'active'),
  
  -- Onitsha North LGA
  ('2348011112701', 'Chukwudi Udoka', 'PU001ON', 'Inland Town', 'Onitsha North', 'Anambra', 'pu_agent', 'active'),
  ('2348011112702', 'Chinenye Okafor', 'PU002ON', 'Inland Town', 'Onitsha North', 'Anambra', 'pu_agent', 'active'),
  ('2348011112703', 'Chinedu Okoli', 'PU003ON', 'GRA', 'Onitsha North', 'Anambra', 'pu_agent', 'active'),
  ('2348011112704', 'Ugochi Okoro', 'PU004ON', 'GRA', 'Onitsha North', 'Anambra', 'pu_agent', 'active'),
  ('2348011112705', 'Obinna Eze', 'PU005ON', 'Woliwo', 'Onitsha North', 'Anambra', 'pu_agent', 'active'),
  
  -- Onitsha South LGA
  ('2348011112801', 'Kamsi Nwankwo', 'PU001OS', 'Fegge', 'Onitsha South', 'Anambra', 'pu_agent', 'active'),
  ('2348011112802', 'Chiamaka Okonkwo', 'PU002OS', 'Fegge', 'Onitsha South', 'Anambra', 'pu_agent', 'active'),
  ('2348011112803', 'Chukwuma Obi', 'PU003OS', 'Odoakpu', 'Onitsha South', 'Anambra', 'pu_agent', 'active'),
  ('2348011112804', 'Adaora Okeke', 'PU004OS', 'Odoakpu', 'Onitsha South', 'Anambra', 'pu_agent', 'active'),
  ('2348011112805', 'Ifeanyi Udoka', 'PU005OS', 'Awada', 'Onitsha South', 'Anambra', 'pu_agent', 'active'),
  
  -- Orumba North LGA
  ('2348011112901', 'Emeka Okafor', 'PU001ORN', 'Ajalli', 'Orumba North', 'Anambra', 'pu_agent', 'active'),
  ('2348011112902', 'Ngozi Okoli', 'PU002ORN', 'Ajalli', 'Orumba North', 'Anambra', 'pu_agent', 'active'),
  ('2348011112903', 'Chinedu Okoro', 'PU003ORN', 'Awa', 'Orumba North', 'Anambra', 'pu_agent', 'active'),
  ('2348011112904', 'Chioma Eze', 'PU004ORN', 'Awa', 'Orumba North', 'Anambra', 'pu_agent', 'active'),
  ('2348011112905', 'Ikechukwu Nwankwo', 'PU005ORN', 'Ndikelionwu', 'Orumba North', 'Anambra', 'pu_agent', 'active'),
  
  -- Orumba South LGA
  ('2348011113001', 'Obiora Okonkwo', 'PU001ORS', 'Umunze', 'Orumba South', 'Anambra', 'pu_agent', 'active'),
  ('2348011113002', 'Ada Obi', 'PU002ORS', 'Umunze', 'Orumba South', 'Anambra', 'pu_agent', 'active'),
  ('2348011113003', 'Chukwudi Okeke', 'PU003ORS', 'Eziagu', 'Orumba South', 'Anambra', 'pu_agent', 'active'),
  ('2348011113004', 'Uchenna Udoka', 'PU004ORS', 'Eziagu', 'Orumba South', 'Anambra', 'pu_agent', 'active'),
  ('2348011113005', 'Ifeanyi Okafor', 'PU005ORS', 'Nawfija', 'Orumba South', 'Anambra', 'pu_agent', 'active'),
  
  -- Oyi LGA
  ('2348011113101', 'Nkechi Okoli', 'PU001OY', 'Nteje', 'Oyi', 'Anambra', 'pu_agent', 'active'),
  ('2348011113102', 'Kelechi Okoro', 'PU002OY', 'Nteje', 'Oyi', 'Anambra', 'pu_agent', 'active'),
  ('2348011113103', 'Oluchi Eze', 'PU003OY', 'Awkuzu', 'Oyi', 'Anambra', 'pu_agent', 'active'),
  ('2348011113104', 'Obinna Nwankwo', 'PU004OY', 'Awkuzu', 'Oyi', 'Anambra', 'pu_agent', 'active'),
  ('2348011113105', 'Adaeze Okonkwo', 'PU005OY', 'Umunya', 'Oyi', 'Anambra', 'pu_agent', 'active')
ON CONFLICT (phone_number) DO NOTHING;

-- Add Ward and LGA Coordinators
INSERT INTO agents (phone_number, name, polling_unit_code, ward, lga, state, role, status) VALUES
  ('2348011110001', 'Ifeanyi Coordinator', 'COORD001', 'Aguata I', 'Aguata', 'Anambra', 'ward_agent', 'active'),
  ('2348011110002', 'Chinedu Coordinator', 'COORD002', 'Awka I', 'Awka South', 'Anambra', 'ward_agent', 'active'),
  ('2348011110003', 'Emeka LGA Coordinator', 'COORD003', 'Central', 'Aguata', 'Anambra', 'lga_agent', 'active'),
  ('2348011110004', 'Ngozi LGA Coordinator', 'COORD004', 'Central', 'Awka South', 'Anambra', 'lga_agent', 'active'),
  ('2348011110005', 'Obiora State Coordinator', 'COORD005', 'Central', 'Central', 'Anambra', 'state_agent', 'active'),
  ('2348011110006', 'Ada C&CC Supervisor', 'COORD006', 'Central', 'Central', 'Anambra', 'ccc_supervisor', 'active')
ON CONFLICT (phone_number) DO NOTHING;
