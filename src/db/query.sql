    CREATE TABLE IF NOT EXISTS roles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE
    );

    INSERT INTO roles (name) VALUES ('worker'), ('recruiter');

    CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(50) UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        hashed_password TEXT,
        login_provider VARCHAR(20) NOT NULL,
        provider_id TEXT, 
        role_id INT NOT NULL REFERENCES roles(id) DEFAULT 1,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );

    CREATE TABLE genders (
        id SERIAL PRIMARY KEY,
        gender_name VARCHAR(30) NOT NULL UNIQUE
    );
    INSERT INTO genders (gender_name) VALUES ('male'), ('female'), ('other');

    CREATE TABLE marriage_statuses (
        id SERIAL PRIMARY KEY,
        status_name VARCHAR(30) NOT NULL UNIQUE
    );

    INSERT INTO marriage_statuses (status_name) VALUES
    ('married'), ('not married'), ('divorced'), ('widowed');

    CREATE TABLE religions (
        id SERIAL PRIMARY KEY,
        religion_name VARCHAR(50) NOT NULL UNIQUE
    );

    INSERT INTO religions (religion_name) VALUES ('Islam'), ('Christianity'), ('Judaism'), ('Hinduism'), ('Buddhism'), ('Other');

    CREATE TABLE nationalities (
        id SERIAL PRIMARY KEY,
        country_name VARCHAR(100) NOT NULL UNIQUE,
        iso_alpha2 CHAR(2) NOT NULL UNIQUE,
        iso_alpha3 CHAR(3) NOT NULL UNIQUE
    );

    INSERT INTO nationalities (country_name, iso_alpha2, iso_alpha3) VALUES
    ('Afghanistan', 'AF', 'AFG'),
    ('Albania', 'AL', 'ALB'),
    ('Algeria', 'DZ', 'DZA'),
    ('Andorra', 'AD', 'AND'),
    ('Angola', 'AO', 'AGO'),
    ('Antigua and Barbuda', 'AG', 'ATG'),
    ('Argentina', 'AR', 'ARG'),
    ('Armenia', 'AM', 'ARM'),
    ('Australia', 'AU', 'AUS'),
    ('Austria', 'AT', 'AUT'),
    ('Azerbaijan', 'AZ', 'AZE'),
    ('Bahamas', 'BS', 'BHS'),
    ('Bahrain', 'BH', 'BHR'),
    ('Bangladesh', 'BD', 'BGD'),
    ('Barbados', 'BB', 'BRB'),
    ('Belarus', 'BY', 'BLR'),
    ('Belgium', 'BE', 'BEL'),
    ('Belize', 'BZ', 'BLZ'),
    ('Benin', 'BJ', 'BEN'),
    ('Bhutan', 'BT', 'BTN'),
    ('Bolivia', 'BO', 'BOL'),
    ('Bosnia and Herzegovina', 'BA', 'BIH'),
    ('Botswana', 'BW', 'BWA'),
    ('Brazil', 'BR', 'BRA'),
    ('Brunei', 'BN', 'BRN'),
    ('Bulgaria', 'BG', 'BGR'),
    ('Burkina Faso', 'BF', 'BFA'),
    ('Burundi', 'BI', 'BDI'),
    ('Cabo Verde', 'CV', 'CPV'),
    ('Cambodia', 'KH', 'KHM'),
    ('Cameroon', 'CM', 'CMR'),
    ('Canada', 'CA', 'CAN'),
    ('Central African Republic', 'CF', 'CAF'),
    ('Chad', 'TD', 'TCD'),
    ('Chile', 'CL', 'CHL'),
    ('China', 'CN', 'CHN'),
    ('Colombia', 'CO', 'COL'),
    ('Comoros', 'KM', 'COM'),
    ('Congo (Congo-Brazzaville)', 'CG', 'COG'),
    ('Congo (Democratic Republic)', 'CD', 'COD'),
    ('Costa Rica', 'CR', 'CRI'),
    ('Croatia', 'HR', 'HRV'),
    ('Cuba', 'CU', 'CUB'),
    ('Cyprus', 'CY', 'CYP'),
    ('Czechia', 'CZ', 'CZE'),
    ('Denmark', 'DK', 'DNK'),
    ('Djibouti', 'DJ', 'DJI'),
    ('Dominica', 'DM', 'DMA'),
    ('Dominican Republic', 'DO', 'DOM'),
    ('Ecuador', 'EC', 'ECU'),
    ('Egypt', 'EG', 'EGY'),
    ('El Salvador', 'SV', 'SLV'),
    ('Equatorial Guinea', 'GQ', 'GNQ'),
    ('Eritrea', 'ER', 'ERI'),
    ('Estonia', 'EE', 'EST'),
    ('Eswatini', 'SZ', 'SWZ'),
    ('Ethiopia', 'ET', 'ETH'),
    ('Fiji', 'FJ', 'FJI'),
    ('Finland', 'FI', 'FIN'),
    ('France', 'FR', 'FRA'),
    ('Gabon', 'GA', 'GAB'),
    ('Gambia', 'GM', 'GMB'),
    ('Georgia', 'GE', 'GEO'),
    ('Germany', 'DE', 'DEU'),
    ('Ghana', 'GH', 'GHA'),
    ('Greece', 'GR', 'GRC'),
    ('Grenada', 'GD', 'GRD'),
    ('Guatemala', 'GT', 'GTM'),
    ('Guinea', 'GN', 'GIN'),
    ('Guinea-Bissau', 'GW', 'GNB'),
    ('Guyana', 'GY', 'GUY'),
    ('Haiti', 'HT', 'HTI'),
    ('Honduras', 'HN', 'HND'),
    ('Hungary', 'HU', 'HUN'),
    ('Iceland', 'IS', 'ISL'),
    ('India', 'IN', 'IND'),
    ('Indonesia', 'ID', 'IDN'),
    ('Iran', 'IR', 'IRN'),
    ('Iraq', 'IQ', 'IRQ'),
    ('Ireland', 'IE', 'IRL'),
    ('Israel', 'IL', 'ISR'),
    ('Italy', 'IT', 'ITA'),
    ('Jamaica', 'JM', 'JAM'),
    ('Japan', 'JP', 'JPN'),
    ('Jordan', 'JO', 'JOR'),
    ('Kazakhstan', 'KZ', 'KAZ'),
    ('Kenya', 'KE', 'KEN'),
    ('Kiribati', 'KI', 'KIR'),
    ('Kuwait', 'KW', 'KWT'),
    ('Kyrgyzstan', 'KG', 'KGZ'),
    ('Laos', 'LA', 'LAO'),
    ('Latvia', 'LV', 'LVA'),
    ('Lebanon', 'LB', 'LBN'),
    ('Lesotho', 'LS', 'LSO'),
    ('Liberia', 'LR', 'LBR'),
    ('Libya', 'LY', 'LBY'),
    ('Liechtenstein', 'LI', 'LIE'),
    ('Lithuania', 'LT', 'LTU'),
    ('Luxembourg', 'LU', 'LUX'),
    ('Madagascar', 'MG', 'MDG'),
    ('Malawi', 'MW', 'MWI'),
    ('Malaysia', 'MY', 'MYS'),
    ('Maldives', 'MV', 'MDV'),
    ('Mali', 'ML', 'MLI'),
    ('Malta', 'MT', 'MLT'),
    ('Marshall Islands', 'MH', 'MHL'),
    ('Mauritania', 'MR', 'MRT'),
    ('Mauritius', 'MU', 'MUS'),
    ('Mexico', 'MX', 'MEX'),
    ('Micronesia', 'FM', 'FSM'),
    ('Moldova', 'MD', 'MDA'),
    ('Monaco', 'MC', 'MCO'),
    ('Mongolia', 'MN', 'MNG'),
    ('Montenegro', 'ME', 'MNE'),
    ('Morocco', 'MA', 'MAR'),
    ('Mozambique', 'MZ', 'MOZ'),
    ('Myanmar (Burma)', 'MM', 'MMR'),
    ('Namibia', 'NA', 'NAM'),
    ('Nauru', 'NR', 'NRU'),
    ('Nepal', 'NP', 'NPL'),
    ('Netherlands', 'NL', 'NLD'),
    ('New Zealand', 'NZ', 'NZL'),
    ('Nicaragua', 'NI', 'NIC'),
    ('Niger', 'NE', 'NER'),
    ('Nigeria', 'NG', 'NGA'),
    ('North Korea', 'KP', 'PRK'),
    ('North Macedonia', 'MK', 'MKD'),
    ('Norway', 'NO', 'NOR'),
    ('Oman', 'OM', 'OMN'),
    ('Pakistan', 'PK', 'PAK'),
    ('Palau', 'PW', 'PLW'),
    ('Palestine State', 'PS', 'PSE'),
    ('Panama', 'PA', 'PAN'),
    ('Papua New Guinea', 'PG', 'PNG'),
    ('Paraguay', 'PY', 'PRY'),
    ('Peru', 'PE', 'PER'),
    ('Philippines', 'PH', 'PHL'),
    ('Poland', 'PL', 'POL'),
    ('Portugal', 'PT', 'PRT'),
    ('Qatar', 'QA', 'QAT'),
    ('Romania', 'RO', 'ROU'),
    ('Russia', 'RU', 'RUS'),
    ('Rwanda', 'RW', 'RWA'),
    ('Saint Kitts and Nevis', 'KN', 'KNA'),
    ('Saint Lucia', 'LC', 'LCA'),
    ('Saint Vincent and the Grenadines', 'VC', 'VCT'),
    ('Samoa', 'WS', 'WSM'),
    ('San Marino', 'SM', 'SMR'),
    ('Sao Tome and Principe', 'ST', 'STP'),
    ('Saudi Arabia', 'SA', 'SAU'),
    ('Senegal', 'SN', 'SEN'),
    ('Serbia', 'RS', 'SRB'),
    ('Seychelles', 'SC', 'SYC'),
    ('Sierra Leone', 'SL', 'SLE'),
    ('Singapore', 'SG', 'SGP'),
    ('Slovakia', 'SK', 'SVK'),
    ('Slovenia', 'SI', 'SVN'),
    ('Solomon Islands', 'SB', 'SLB'),
    ('Somalia', 'SO', 'SOM'),
    ('South Africa', 'ZA', 'ZAF'),
    ('South Korea', 'KR', 'KOR'),
    ('South Sudan', 'SS', 'SSD'),
    ('Spain', 'ES', 'ESP'),
    ('Sri Lanka', 'LK', 'LKA'),
    ('Sudan', 'SD', 'SDN'),
    ('Suriname', 'SR', 'SUR'),
    ('Sweden', 'SE', 'SWE'),
    ('Switzerland', 'CH', 'CHE'),
    ('Syria', 'SY', 'SYR'),
    ('Taiwan', 'TW', 'TWN'),
    ('Tajikistan', 'TJ', 'TJK'),
    ('Tanzania', 'TZ', 'TZA'),
    ('Thailand', 'TH', 'THA'),
    ('Timor-Leste', 'TL', 'TLS'),
    ('Togo', 'TG', 'TGO'),
    ('Tonga', 'TO', 'TON'),
    ('Trinidad and Tobago', 'TT', 'TTO'),
    ('Tunisia', 'TN', 'TUN'),
    ('Turkey', 'TR', 'TUR'),
    ('Turkmenistan', 'TM', 'TKM'),
    ('Tuvalu', 'TV', 'TUV'),
    ('Uganda', 'UG', 'UGA'),
    ('Ukraine', 'UA', 'UKR'),
    ('United Arab Emirates', 'AE', 'ARE'),
    ('United Kingdom', 'GB', 'GBR'),
    ('United States of America', 'US', 'USA'),
    ('Uruguay', 'UY', 'URY'),
    ('Uzbekistan', 'UZ', 'UZB'),
    ('Vanuatu', 'VU', 'VUT'),
    ('Vatican City', 'VA', 'VAT'),
    ('Venezuela', 'VE', 'VEN'),
    ('Vietnam', 'VN', 'VNM'),
    ('Yemen', 'YE', 'YEM'),
    ('Zambia', 'ZM', 'ZMB'),
    ('Zimbabwe', 'ZW', 'ZWE');

    CREATE TABLE IF NOT EXISTS workers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        avatar_url TEXT,
        telephone VARCHAR(20),
        date_of_birth DATE,
        gender_id INT REFERENCES genders(id),
        nationality_id INT REFERENCES nationalities(id),
        religion_id INT REFERENCES religions(id),
        marriage_status_id INT REFERENCES marriage_statuses(id),
        address TEXT,
        profile_summary TEXT,
        current_salary DECIMAL(12,2),
        expected_salary DECIMAL(12,2),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS industries (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );

    INSERT INTO industries (name) VALUES
    ('Information Technology'),
    ('Finance & Banking'),
    ('Healthcare & Medicine'),
    ('Education & Training'),
    ('Manufacturing & Production'),
    ('E-Commerce & Retail'),
    ('Transportation & Logistics'),
    ('Construction & Real Estate'),
    ('Tourism & Hospitality'),
    ('Environmental & Energy'),
    ('Government & Public Sector'),
    ('Legal & Consulting');


    CREATE TABLE IF NOT EXISTS recruiters (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL UNIQUE,
        company_name VARCHAR(150) NOT NULL,
        avatar_url TEXT,
        company_website VARCHAR(255),
        contact_name VARCHAR(100) NOT NULL,
        contact_phone VARCHAR(30) NOT NULL,
        address TEXT,
        industry_id INTEGER,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT fk_recruiter_user
            FOREIGN KEY (user_id) REFERENCES users(id)
            ON DELETE CASCADE,
        CONSTRAINT fk_recruiter_industry
            FOREIGN KEY (industry_id) REFERENCES industries(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS skills (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        skill_name VARCHAR(100) NOT NULL UNIQUE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS worker_skills (
        worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
        skill_id  UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        PRIMARY KEY (worker_id, skill_id)  -- prevents duplicates
    );

    CREATE TABLE IF NOT EXISTS work_experiences (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        worker_id UUID NOT NULL,
        company_name VARCHAR(150) NOT NULL,
        job_title VARCHAR(100) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE,
        is_current BOOLEAN DEFAULT FALSE,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_work_exp_worker
            FOREIGN KEY (worker_id) REFERENCES workers(id)
            ON DELETE CASCADE,
        CONSTRAINT chk_end_date_after_start CHECK (end_date IS NULL OR end_date >= start_date),
        CONSTRAINT chk_current_no_end_date CHECK (is_current = FALSE OR end_date IS NULL)
    );

    CREATE TABLE IF NOT EXISTS portfolios (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        worker_id UUID NOT NULL,
        title VARCHAR(150) NOT NULL,
        description TEXT,
        link VARCHAR(500) NOT NULL,
        is_public BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_portfolio_worker
            FOREIGN KEY (worker_id) REFERENCES workers(id)
            ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS educations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        worker_id UUID NOT NULL,
        institution_name VARCHAR(150) NOT NULL,
        degree VARCHAR(100) NOT NULL,
        major VARCHAR(100),
        start_date DATE NOT NULL,
        end_date DATE,
        is_current BOOLEAN DEFAULT FALSE,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_education_worker
            FOREIGN KEY (worker_id) REFERENCES workers(id)
            ON DELETE CASCADE,
        CONSTRAINT chk_end_date_after_start CHECK (end_date IS NULL OR end_date >= start_date),
        CONSTRAINT chk_current_no_end_date CHECK (is_current = FALSE OR end_date IS NULL)
    );

    CREATE TABLE IF NOT EXISTS certifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        worker_id UUID NOT NULL,
        name VARCHAR(150) NOT NULL,
        issuer VARCHAR(150) NOT NULL,
        issue_date DATE NOT NULL,
        expiry_date DATE,
        credential_id VARCHAR(100),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_certification_worker
            FOREIGN KEY (worker_id) REFERENCES workers(id)
            ON DELETE CASCADE,
        CONSTRAINT chk_expiry_after_issue CHECK (expiry_date IS NULL OR expiry_date >= issue_date)
    );

    CREATE TABLE IF NOT EXISTS proficiency_levels (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE
    );

    INSERT INTO proficiency_levels (name) 
    VALUES ('Beginner'), ('Intermediate'), ('Fluent'), ('Native');

    CREATE TABLE IF NOT EXISTS languages ( -- Add lookup table
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        worker_id UUID NOT NULL,
        language_name VARCHAR(100) NOT NULL,
        proficiency_level_id INT NOT NULL REFERENCES proficiency_levels(id),
        is_primary BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_language_worker
            FOREIGN KEY (worker_id) REFERENCES workers(id)
            ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS employment_types (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE
    );

    INSERT INTO employment_types (name)
    VALUES ('Full-time'), ('Part-time'), ('Contract'), ('Internship'), ('Freelance');

    CREATE TABLE IF NOT EXISTS job_post_statuses (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE
    );

    INSERT INTO job_post_statuses (name)
    VALUES ('OPEN'), ('CLOSED'), ('DRAFT');

    CREATE TABLE IF NOT EXISTS salary_types (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE
    );

    INSERT INTO salary_types (name) VALUES ('daily'), ('weekly'), ('monthly'), ('yearly');

    CREATE TABLE IF NOT EXISTS experience_levels (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE
    );

    INSERT INTO experience_levels (name) VALUES ('Fresh Graduate'), ('Junior'), ('Middle'), ('Senior');

    -- ==========================================
    -- ISO 4217 Currencies Lookup Table
    -- ==========================================
    CREATE TABLE IF NOT EXISTS currencies (
        id SERIAL PRIMARY KEY,
        code CHAR(3) NOT NULL UNIQUE,      -- ISO 4217 alphabetic code
        numeric_code CHAR(3) NOT NULL,     -- ISO 4217 numeric code
        name VARCHAR(100) NOT NULL,        -- Currency name
        symbol VARCHAR(10)                 -- Common symbol (when available)
    );

    -- ==========================================
    -- Full ISO 4217 Currency Dataset
    -- ==========================================
    INSERT INTO currencies (code, numeric_code, name, symbol) VALUES
    ('AED', '784', 'United Arab Emirates Dirham', 'د.إ'),
    ('AFN', '971', 'Afghan Afghani', '؋'),
    ('ALL', '008', 'Albanian Lek', 'L'),
    ('AMD', '051', 'Armenian Dram', '֏'),
    ('ANG', '532', 'Netherlands Antillean Guilder', 'ƒ'),
    ('AOA', '973', 'Angolan Kwanza', 'Kz'),
    ('ARS', '032', 'Argentine Peso', '$'),
    ('AUD', '036', 'Australian Dollar', 'A$'),
    ('AWG', '533', 'Aruban Florin', 'ƒ'),
    ('AZN', '944', 'Azerbaijani Manat', '₼'),
    ('BAM', '977', 'Bosnia and Herzegovina Convertible Mark', 'KM'),
    ('BBD', '052', 'Barbados Dollar', 'Bds$'),
    ('BDT', '050', 'Bangladeshi Taka', '৳'),
    ('BGN', '975', 'Bulgarian Lev', 'лв'),
    ('BHD', '048', 'Bahraini Dinar', '.د.ب'),
    ('BIF', '108', 'Burundian Franc', 'FBu'),
    ('BMD', '060', 'Bermudian Dollar', '$'),
    ('BND', '096', 'Brunei Dollar', 'B$'),
    ('BOB', '068', 'Boliviano', 'Bs.'),
    ('BRL', '986', 'Brazilian Real', 'R$'),
    ('BSD', '044', 'Bahamian Dollar', 'B$'),
    ('BTN', '064', 'Bhutanese Ngultrum', 'Nu.'),
    ('BWP', '072', 'Botswana Pula', 'P'),
    ('BYN', '933', 'Belarusian Ruble', 'Br'),
    ('BZD', '084', 'Belize Dollar', 'BZ$'),
    ('CAD', '124', 'Canadian Dollar', 'C$'),
    ('CDF', '976', 'Congolese Franc', 'FC'),
    ('CHF', '756', 'Swiss Franc', 'CHF'),
    ('CLP', '152', 'Chilean Peso', '$'),
    ('CNY', '156', 'Chinese Yuan Renminbi', '¥'),
    ('COP', '170', 'Colombian Peso', '$'),
    ('CRC', '188', 'Costa Rican Colón', '₡'),
    ('CUP', '192', 'Cuban Peso', '₱'),
    ('CVE', '132', 'Cabo Verde Escudo', '$'),
    ('CZK', '203', 'Czech Koruna', 'Kč'),
    ('DJF', '262', 'Djiboutian Franc', 'Fdj'),
    ('DKK', '208', 'Danish Krone', 'kr'),
    ('DOP', '214', 'Dominican Peso', 'RD$'),
    ('DZD', '012', 'Algerian Dinar', 'دج'),
    ('EGP', '818', 'Egyptian Pound', '£'),
    ('ERN', '232', 'Eritrean Nakfa', 'Nfk'),
    ('ETB', '230', 'Ethiopian Birr', 'Br'),
    ('EUR', '978', 'Euro', '€'),
    ('FJD', '242', 'Fiji Dollar', 'FJ$'),
    ('FKP', '238', 'Falkland Islands Pound', '£'),
    ('FOK', '234', 'Faroese Króna', 'kr'),
    ('GBP', '826', 'Pound Sterling', '£'),
    ('GEL', '981', 'Georgian Lari', '₾'),
    ('GGP', '826', 'Guernsey Pound', '£'),
    ('GHS', '936', 'Ghanaian Cedi', '₵'),
    ('GIP', '292', 'Gibraltar Pound', '£'),
    ('GMD', '270', 'Gambian Dalasi', 'D'),
    ('GNF', '324', 'Guinean Franc', 'FG'),
    ('GTQ', '320', 'Guatemalan Quetzal', 'Q'),
    ('GYD', '328', 'Guyanese Dollar', 'G$'),
    ('HKD', '344', 'Hong Kong Dollar', 'HK$'),
    ('HNL', '340', 'Honduran Lempira', 'L'),
    ('HRK', '191', 'Croatian Kuna', 'kn'),
    ('HTG', '332', 'Haitian Gourde', 'G'),
    ('HUF', '348', 'Hungarian Forint', 'Ft'),
    ('IDR', '360', 'Indonesian Rupiah', 'Rp'),
    ('ILS', '376', 'Israeli New Shekel', '₪'),
    ('IMP', '826', 'Isle of Man Pound', '£'),
    ('INR', '356', 'Indian Rupee', '₹'),
    ('IQD', '368', 'Iraqi Dinar', 'ع.د'),
    ('IRR', '364', 'Iranian Rial', '﷼'),
    ('ISK', '352', 'Icelandic Króna', 'kr'),
    ('JEP', '826', 'Jersey Pound', '£'),
    ('JMD', '388', 'Jamaican Dollar', 'J$'),
    ('JOD', '400', 'Jordanian Dinar', 'JD'),
    ('JPY', '392', 'Japanese Yen', '¥'),
    ('KES', '404', 'Kenyan Shilling', 'Sh'),
    ('KGS', '417', 'Kyrgyzstani Som', 'с'),
    ('KHR', '116', 'Cambodian Riel', '៛'),
    ('KID', '036', 'Kiribati Dollar', 'K$'),
    ('KMF', '174', 'Comorian Franc', 'CF'),
    ('KRW', '410', 'South Korean Won', '₩'),
    ('KWD', '414', 'Kuwaiti Dinar', 'KD'),
    ('KYD', '136', 'Cayman Islands Dollar', 'CI$'),
    ('KZT', '398', 'Kazakhstani Tenge', '₸'),
    ('LAK', '418', 'Lao Kip', '₭'),
    ('LBP', '422', 'Lebanese Pound', 'ل.ل'),
    ('LKR', '144', 'Sri Lanka Rupee', 'Rs'),
    ('LRD', '430', 'Liberian Dollar', 'L$'),
    ('LSL', '426', 'Lesotho Loti', 'L'),
    ('LYD', '434', 'Libyan Dinar', 'LD'),
    ('MAD', '504', 'Moroccan Dirham', 'DH'),
    ('MDL', '498', 'Moldovan Leu', 'L'),
    ('MGA', '969', 'Malagasy Ariary', 'Ar'),
    ('MKD', '807', 'Macedonian Denar', 'ден'),
    ('MMK', '104', 'Myanmar Kyat', 'K'),
    ('MNT', '496', 'Mongolian Tögrög', '₮'),
    ('MOP', '446', 'Macanese Pataca', 'MOP$'),
    ('MRU', '929', 'Mauritanian Ouguiya', 'UM'),
    ('MUR', '480', 'Mauritian Rupee', '₨'),
    ('MVR', '462', 'Maldivian Rufiyaa', 'Rf'),
    ('MWK', '454', 'Malawian Kwacha', 'MK'),
    ('MXN', '484', 'Mexican Peso', 'MX$'),
    ('MYR', '458', 'Malaysian Ringgit', 'RM'),
    ('MZN', '943', 'Mozambican Metical', 'MT'),
    ('NAD', '516', 'Namibian Dollar', 'N$'),
    ('NGN', '566', 'Nigerian Naira', '₦'),
    ('NIO', '558', 'Nicaraguan Córdoba', 'C$'),
    ('NOK', '578', 'Norwegian Krone', 'kr'),
    ('NPR', '524', 'Nepalese Rupee', '₨'),
    ('NZD', '554', 'New Zealand Dollar', 'NZ$'),
    ('OMR', '512', 'Omani Rial', '﷼'),
    ('PAB', '590', 'Panamanian Balboa', 'B/.'),
    ('PEN', '604', 'Peruvian Sol', 'S/'),
    ('PGK', '598', 'Papua New Guinean Kina', 'K'),
    ('PHP', '608', 'Philippine Peso', '₱'),
    ('PKR', '586', 'Pakistani Rupee', '₨'),
    ('PLN', '985', 'Polish Złoty', 'zł'),
    ('PYG', '600', 'Paraguayan Guaraní', '₲'),
    ('QAR', '634', 'Qatari Rial', '﷼'),
    ('RON', '946', 'Romanian Leu', 'lei'),
    ('RSD', '941', 'Serbian Dinar', 'дин'),
    ('RUB', '643', 'Russian Ruble', '₽'),
    ('RWF', '646', 'Rwandan Franc', 'FRw'),
    ('SAR', '682', 'Saudi Riyal', '﷼'),
    ('SBD', '090', 'Solomon Islands Dollar', 'SI$'),
    ('SCR', '690', 'Seychelles Rupee', '₨'),
    ('SDG', '938', 'Sudanese Pound', 'ج.س.'),
    ('SEK', '752', 'Swedish Krona', 'kr'),
    ('SGD', '702', 'Singapore Dollar', 'S$'),
    ('SHP', '654', 'Saint Helena Pound', '£'),
    ('SLE', '925', 'Sierra Leonean Leone', 'Le'),
    ('SOS', '706', 'Somali Shilling', 'Sh'),
    ('SRD', '968', 'Surinamese Dollar', 'SRD$'),
    ('SSP', '728', 'South Sudanese Pound', '£'),
    ('STN', '930', 'São Tomé and Príncipe Dobra', 'Db'),
    ('SYP', '760', 'Syrian Pound', '£'),
    ('SZL', '748', 'Eswatini Lilangeni', 'L'),
    ('THB', '764', 'Thai Baht', '฿'),
    ('TJS', '972', 'Tajikistani Somoni', 'SM'),
    ('TMT', '934', 'Turkmenistani Manat', 'T'),
    ('TND', '788', 'Tunisian Dinar', 'د.ت'),
    ('TOP', '776', 'Tongan Paʻanga', 'T$'),
    ('TRY', '949', 'Turkish Lira', '₺'),
    ('TTD', '780', 'Trinidad and Tobago Dollar', 'TT$'),
    ('TVD', '036', 'Tuvaluan Dollar', 'T$'),
    ('TWD', '901', 'New Taiwan Dollar', 'NT$'),
    ('TZS', '834', 'Tanzanian Shilling', 'Sh'),
    ('UAH', '980', 'Ukrainian Hryvnia', '₴'),
    ('UGX', '800', 'Ugandan Shilling', 'USh'),
    ('USD', '840', 'United States Dollar', '$'),
    ('UYU', '858', 'Uruguayan Peso', '$U'),
    ('UZS', '860', 'Uzbekistani Soʻm', 'лв'),
    ('VES', '928', 'Venezuelan Bolívar', 'Bs.'),
    ('VND', '704', 'Vietnamese Đồng', '₫'),
    ('VUV', '548', 'Vanuatu Vatu', 'VT'),
    ('WST', '882', 'Samoan Tālā', 'WS$'),
    ('XAF', '950', 'CFA Franc BEAC', 'FCFA'),
    ('XCD', '951', 'East Caribbean Dollar', 'EC$'),
    ('XDR', '960', 'IMF Special Drawing Rights', 'SDR'),
    ('XOF', '952', 'CFA Franc BCEAO', 'CFA'),
    ('XPF', '953', 'CFP Franc', '₣'),
    ('YER', '886', 'Yemeni Rial', '﷼'),
    ('ZAR', '710', 'South African Rand', 'R'),
    ('ZMW', '967', 'Zambian Kwacha', 'ZK'),
    ('ZWL', '932', 'Zimbabwean Dollar', 'Z$');


    CREATE TABLE IF NOT EXISTS job_posts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        recruiter_id UUID NOT NULL,
        title VARCHAR(150) NOT NULL,
        description TEXT NOT NULL,
        location VARCHAR(150) NOT NULL,
        employment_type_id INT NOT NULL REFERENCES employment_types(id),
        experience_level_id INT NOT NULL REFERENCES experience_levels(id),
        salary_min NUMERIC(12,2),
        salary_max NUMERIC(12,2),
        salary_type_id INT NOT NULL REFERENCES salary_types(id),
        currency_id INT REFERENCES currencies(id),
        published_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        deadline DATE,
        status_id INT NOT NULL REFERENCES job_post_statuses(id),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_jobpost_recruiter
            FOREIGN KEY (recruiter_id) REFERENCES recruiters(id) ON DELETE CASCADE,

        -- Salary validation
        CONSTRAINT chk_salary_range
            CHECK (salary_min IS NULL OR salary_max IS NULL OR salary_min <= salary_max)
    );

    CREATE TABLE job_tags (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL UNIQUE
    );

    CREATE TABLE job_post_tags (
        job_post_id UUID NOT NULL REFERENCES job_posts(id) ON DELETE CASCADE,
        tag_id UUID NOT NULL REFERENCES job_tags(id) ON DELETE CASCADE,
        PRIMARY KEY (job_post_id, tag_id)
    );

    -- Worker resume library (a worker can upload multiple resumes)
    CREATE TABLE IF NOT EXISTS resumes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
        resume_url TEXT NOT NULL,                       -- storage location (S3, GCP, etc.)
        title VARCHAR(150) NOT NULL,                    -- e.g. "Backend Resume - 2025"
        is_default BOOLEAN NOT NULL DEFAULT FALSE,     -- optional: worker’s default resume
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );

    CREATE UNIQUE INDEX uq_worker_default_resume
    ON resumes(worker_id)
    WHERE is_default = true;

    CREATE TABLE IF NOT EXISTS application_statuses (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE
    );

    INSERT INTO application_statuses (name)
    VALUES ('APPLIED'), ('IN_REVIEW'), ('SHORTLISTED'), ('REJECTED'), ('HIRED');

    CREATE TABLE IF NOT EXISTS job_applications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        job_post_id UUID NOT NULL,
        worker_id UUID NOT NULL,
        resume_id UUID NULL,
        cover_letter TEXT,
        application_status_id INT NOT NULL REFERENCES application_statuses(id),
        applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_app_jobpost
            FOREIGN KEY (job_post_id) REFERENCES job_posts(id) ON DELETE CASCADE,
        CONSTRAINT fk_app_worker
            FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE,
        CONSTRAINT uq_worker_job UNIQUE (job_post_id, worker_id),  -- one worker can only apply once per posting
        CONSTRAINT fk_app_resume
            FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS question_types (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE
    );

    INSERT INTO question_types (name)
    VALUES ('TEXT'), ('RATING'), ('MULTIPLE_CHOICE'), ('BOOLEAN');

    -- The job questions purpose is act as part of application process, so the worker should fill/answer the question in order to fulfill the application requirement, some question might be optional or required, it depends on the recruiter that input the questions for specific job posting that they posted
    CREATE TABLE IF NOT EXISTS job_post_questions (
        id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        job_post_id      UUID NOT NULL,
        question_text    TEXT        NOT NULL,
        question_type_id INT NOT NULL REFERENCES question_types(id),
        options          JSONB,
        is_required      BOOLEAN     NOT NULL DEFAULT TRUE,
        order_index      INTEGER     NOT NULL DEFAULT 0,
        created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

        -- Foreign key to job_posts
        CONSTRAINT fk_q_jobpost
            FOREIGN KEY (job_post_id)
            REFERENCES job_posts(id)
            ON DELETE CASCADE,

        -- Order must be ≥ 0
        CONSTRAINT chk_order_index
            CHECK (order_index >= 0)
    );

    CREATE TABLE IF NOT EXISTS job_post_answers (
        id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        job_application_id UUID NOT NULL,
        question_id       UUID NOT NULL,
        answer            JSONB NOT NULL, -- stores all answer types
        submitted_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

        -- FK to job applications (scopes answers per application)
        CONSTRAINT fk_a_application
            FOREIGN KEY (job_application_id)
            REFERENCES job_applications(id)
            ON DELETE CASCADE,

        -- FK to questions
        CONSTRAINT fk_a_question
            FOREIGN KEY (question_id)
            REFERENCES job_post_questions(id)
            ON DELETE CASCADE,

        -- Ensure each question is answered once per application
        CONSTRAINT uq_app_question
            UNIQUE (job_application_id, question_id)
    );

    CREATE TABLE IF NOT EXISTS saved_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_post_id UUID NOT NULL,
    worker_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_saved_jobs_worker_job UNIQUE (worker_id, job_post_id),
    CONSTRAINT fk_saved_jobs_jobpost FOREIGN KEY (job_post_id) REFERENCES job_posts(id) ON DELETE CASCADE,
    CONSTRAINT fk_saved_jobs_worker FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE RESTRICT
    );

    -- Indexes to speed common lookups
    CREATE INDEX IF NOT EXISTS idx_saved_jobs_worker_created_at ON saved_jobs (worker_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_saved_jobs_job_post ON saved_jobs (job_post_id);

    -- GIN index for JSONB queries
    CREATE INDEX idx_job_post_answers_answer
    ON job_post_answers USING GIN (answer);

    -- Worker-related indexes
    CREATE INDEX idx_work_experiences_worker_id ON work_experiences(worker_id);
    CREATE INDEX idx_educations_worker_id ON educations(worker_id);
    CREATE INDEX idx_certifications_worker_id ON certifications(worker_id);
    CREATE INDEX idx_languages_worker_id ON languages(worker_id);
    CREATE INDEX idx_portfolios_worker_id ON portfolios(worker_id);

    -- Skills relationship
    CREATE INDEX idx_worker_skills_skill_id ON worker_skills(skill_id);

    -- Job posts relationships
    CREATE INDEX idx_job_posts_recruiter_id ON job_posts(recruiter_id);
    CREATE INDEX idx_job_post_answers_app_id ON job_post_answers(job_application_id);
    CREATE INDEX idx_job_applications_job_post_id ON job_applications(job_post_id);
    CREATE INDEX idx_job_post_questions_job_post_id ON job_post_questions(job_post_id);
    CREATE INDEX idx_job_applications_worker_id ON job_applications(worker_id);

    -- Job Application → Resume
    CREATE INDEX idx_job_applications_resume_id ON job_applications(resume_id);

