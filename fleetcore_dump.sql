--
-- PostgreSQL database dump
--

\restrict 65GPyRXy62BpbFlxKtDYFhWPETYKIqAkiIjC2KsBqQK8zKivK6zWHDroroYpPin

-- Dumped from database version 16.14
-- Dumped by pg_dump version 16.14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: btree_gist; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA public;


--
-- Name: EXTENSION btree_gist; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION btree_gist IS 'support for indexing common datatypes in GiST';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: maintenance_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.maintenance_status_enum AS ENUM (
    'SCHEDULED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED'
);


ALTER TYPE public.maintenance_status_enum OWNER TO postgres;

--
-- Name: maintenance_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.maintenance_type_enum AS ENUM (
    'PREVENTIVE',
    'CORRECTIVE'
);


ALTER TYPE public.maintenance_type_enum OWNER TO postgres;

--
-- Name: user_role_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_role_enum AS ENUM (
    'ADMIN',
    'MECHANIC'
);


ALTER TYPE public.user_role_enum OWNER TO postgres;

--
-- Name: vehicle_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.vehicle_status_enum AS ENUM (
    'AVAILABLE',
    'IN_MAINTENANCE',
    'INACTIVE'
);


ALTER TYPE public.vehicle_status_enum OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: maintenances; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.maintenances (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    type public.maintenance_type_enum NOT NULL,
    description character varying(1000) NOT NULL,
    mileage integer NOT NULL,
    "scheduledStartDate" timestamp with time zone NOT NULL,
    "scheduledEndDate" timestamp with time zone NOT NULL,
    status public.maintenance_status_enum DEFAULT 'SCHEDULED'::public.maintenance_status_enum NOT NULL,
    "workPerformed" character varying(2000),
    "finalCost" numeric(12,2),
    "finalMileage" integer,
    "finishedAt" timestamp with time zone,
    "vehicleId" uuid NOT NULL,
    "mechanicId" uuid NOT NULL,
    "workshopId" uuid NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.maintenances OWNER TO postgres;

--
-- Name: migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    "timestamp" bigint NOT NULL,
    name character varying NOT NULL
);


ALTER TABLE public.migrations OWNER TO postgres;

--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.migrations_id_seq OWNER TO postgres;

--
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    role public.user_role_enum NOT NULL,
    specialty character varying(100),
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: vehicles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vehicles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    plate character varying(15) NOT NULL,
    brand character varying(50) NOT NULL,
    model character varying(50) NOT NULL,
    year integer NOT NULL,
    mileage integer NOT NULL,
    status public.vehicle_status_enum DEFAULT 'AVAILABLE'::public.vehicle_status_enum NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.vehicles OWNER TO postgres;

--
-- Name: workshops; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.workshops (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    address character varying(255) NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.workshops OWNER TO postgres;

--
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- Data for Name: maintenances; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.maintenances (id, type, description, mileage, "scheduledStartDate", "scheduledEndDate", status, "workPerformed", "finalCost", "finalMileage", "finishedAt", "vehicleId", "mechanicId", "workshopId", "createdAt", "updatedAt") FROM stdin;
15a6b9b9-9e46-41f9-b500-a93ddf1ebbe0	PREVENTIVE	Scheduled 45,000 km service	45000	2026-10-13 15:47:47.399+00	2026-10-13 18:47:47.399+00	COMPLETED	Engine oil and filter change, brake inspection	185.50	45300	2026-10-13 18:27:47.399+00	66fe9c59-1641-4238-ac7e-6935e5776a2e	9d1f8c34-adf3-4ac4-af00-4d9f21136c01	23a900c2-8ef5-4e45-9f7c-200191402c89	2026-10-27 15:47:47.18996+00	2026-10-27 15:47:47.18996+00
87311eca-7ef0-46e0-b295-90205d41bc33	CORRECTIVE	Replace worn front brake pads and discs	78000	2026-10-27 13:47:47.399+00	2026-10-27 21:47:47.399+00	IN_PROGRESS	\N	\N	\N	\N	d0c897b0-fb3e-4f55-b9c5-1519bc052328	8a23c264-28ff-46c6-8fb2-533240688890	23a900c2-8ef5-4e45-9f7c-200191402c89	2026-10-27 15:47:47.18996+00	2026-10-27 15:47:47.18996+00
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.migrations (id, "timestamp", name) FROM stdin;
1	1793111693849	CreateUsersTable1793111693849
2	1793112147977	CreateVehiclesTable1793112147977
3	1793112393291	CreateWorkshopsTable1793112393291
4	1793113003314	CreateMaintenancesTable1793113003314
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email, password, role, specialty, "isActive", "createdAt", "updatedAt") FROM stdin;
b00b1962-d80f-4cc7-b2fa-a0f2a9187b5f	Fleet Admin	admin@fleetcore.com	$2b$10$AIDDuwQ81J0hGfTiquVvHunEeqheR4m/n9CsL./evzf7yNs5fzE7O	ADMIN	\N	t	2026-10-27 15:47:47.18996+00	2026-10-27 15:47:47.18996+00
9d1f8c34-adf3-4ac4-af00-4d9f21136c01	Carlos Mechanic	mechanic1@fleetcore.com	$2b$10$8QvV8NVz7LNfo/108z3GF.6wWLzMkwSPRH3T.lqR1j1aySJ6GXItK	MECHANIC	Engines	t	2026-10-27 15:47:47.18996+00	2026-10-27 15:47:47.18996+00
8a23c264-28ff-46c6-8fb2-533240688890	Laura Mechanic	mechanic2@fleetcore.com	$2b$10$WSdpkQghi4R685hegc/bzOWOyDnvRJo7BCwasc6ps3IJYfsB8b.e2	MECHANIC	Brakes and suspension	t	2026-10-27 15:47:47.18996+00	2026-10-27 15:47:47.18996+00
85b51839-416e-4c99-b134-9f546e5c6986	Mario Mechanic	mechanic3@fleetcore.com	$2b$10$PVvJIgvf3t3.UxhCRUEILeOYyr3aDGIPw0yn3mji/jyEBeLZ7/I/W	MECHANIC	Electrical systems	f	2026-10-27 15:47:47.18996+00	2026-10-27 15:47:47.18996+00
\.


--
-- Data for Name: vehicles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vehicles (id, plate, brand, model, year, mileage, status, "createdAt", "updatedAt") FROM stdin;
66fe9c59-1641-4238-ac7e-6935e5776a2e	ABC123	Toyota	Hilux	2021	45300	AVAILABLE	2026-10-27 15:47:47.18996+00	2026-10-27 15:47:47.18996+00
9664fca6-c143-4d42-9edd-53ec388ae13f	DEF456	Ford	Ranger	2022	28000	AVAILABLE	2026-10-27 15:47:47.18996+00	2026-10-27 15:47:47.18996+00
d0c897b0-fb3e-4f55-b9c5-1519bc052328	GHI789	Mazda	BT-50	2020	78000	IN_MAINTENANCE	2026-10-27 15:47:47.18996+00	2026-10-27 15:47:47.18996+00
32388c7f-fc6e-4a7e-aca8-4a27ab19da11	JKL012	Kia	Rio	2018	120500	INACTIVE	2026-10-27 15:47:47.18996+00	2026-10-27 15:47:47.18996+00
\.


--
-- Data for Name: workshops; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.workshops (id, name, address, "isActive", "createdAt", "updatedAt") FROM stdin;
23a900c2-8ef5-4e45-9f7c-200191402c89	Central Workshop	Calle 10 # 5-20, Bogota	t	2026-10-27 15:47:47.18996+00	2026-10-27 15:47:47.18996+00
4a50f3b5-a845-48c1-a6cb-8d4439c98795	North Workshop	Carrera 15 # 100-45, Bogota	f	2026-10-27 15:47:47.18996+00	2026-10-27 15:47:47.18996+00
\.


--
-- Name: migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.migrations_id_seq', 4, true);


--
-- Name: maintenances EX_maintenances_mechanic_schedule; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenances
    ADD CONSTRAINT "EX_maintenances_mechanic_schedule" EXCLUDE USING gist ("mechanicId" WITH =, tstzrange("scheduledStartDate", "scheduledEndDate", '[)'::text) WITH &&) WHERE ((status = ANY (ARRAY['SCHEDULED'::public.maintenance_status_enum, 'IN_PROGRESS'::public.maintenance_status_enum])));


--
-- Name: vehicles PK_18d8646b59304dce4af3a9e35b6; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT "PK_18d8646b59304dce4af3a9e35b6" PRIMARY KEY (id);


--
-- Name: maintenances PK_62403473bd524a42d58589aa78b; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenances
    ADD CONSTRAINT "PK_62403473bd524a42d58589aa78b" PRIMARY KEY (id);


--
-- Name: workshops PK_6d0e82a124f5b53df91c8989848; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workshops
    ADD CONSTRAINT "PK_6d0e82a124f5b53df91c8989848" PRIMARY KEY (id);


--
-- Name: migrations PK_8c82d7f526340ab734260ea46be; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT "PK_8c82d7f526340ab734260ea46be" PRIMARY KEY (id);


--
-- Name: users PK_a3ffb1c0c8416b9fc6f907b7433; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY (id);


--
-- Name: users UQ_97672ac88f789774dd47f7c8be3; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE (email);


--
-- Name: vehicles UQ_ec7181ebdab798d97070122a5bf; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT "UQ_ec7181ebdab798d97070122a5bf" UNIQUE (plate);


--
-- Name: IDX_3a9ba7c05e1ffba00560d11f36; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_3a9ba7c05e1ffba00560d11f36" ON public.maintenances USING btree ("mechanicId");


--
-- Name: IDX_daa193fdfccde41a2ed4de8a47; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_daa193fdfccde41a2ed4de8a47" ON public.maintenances USING btree ("vehicleId");


--
-- Name: UQ_maintenances_active_vehicle; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "UQ_maintenances_active_vehicle" ON public.maintenances USING btree ("vehicleId") WHERE (status = ANY (ARRAY['SCHEDULED'::public.maintenance_status_enum, 'IN_PROGRESS'::public.maintenance_status_enum]));


--
-- Name: maintenances FK_3a9ba7c05e1ffba00560d11f364; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenances
    ADD CONSTRAINT "FK_3a9ba7c05e1ffba00560d11f364" FOREIGN KEY ("mechanicId") REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: maintenances FK_75331cd2a0f0c22bcb2fc4f6d6a; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenances
    ADD CONSTRAINT "FK_75331cd2a0f0c22bcb2fc4f6d6a" FOREIGN KEY ("workshopId") REFERENCES public.workshops(id) ON DELETE RESTRICT;


--
-- Name: maintenances FK_daa193fdfccde41a2ed4de8a474; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenances
    ADD CONSTRAINT "FK_daa193fdfccde41a2ed4de8a474" FOREIGN KEY ("vehicleId") REFERENCES public.vehicles(id) ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict 65GPyRXy62BpbFlxKtDYFhWPETYKIqAkiIjC2KsBqQK8zKivK6zWHDroroYpPin

