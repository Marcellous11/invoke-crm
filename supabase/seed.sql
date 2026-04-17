-- ============================================================
-- Invoke CRM/PM — Seed Data
-- Local dev: creates test users automatically.
-- Remote: uses the first registered user as the owner.
-- Test login → admin@invoke.dev / password123
-- ============================================================

do $$
declare
  -- Users
  v_admin     uuid;
  v_jordan    uuid;
  v_priya     uuid;
  v_carlos    uuid;
  v_mia       uuid;

  -- Clients
  v_acme      uuid;
  v_techstart uuid;
  v_meridian  uuid;
  v_bluwave   uuid;
  v_forge     uuid;
  v_nova      uuid;

  -- Projects
  v_proj1  uuid; v_proj2  uuid; v_proj3  uuid;
  v_proj4  uuid; v_proj5  uuid; v_proj6  uuid;
  v_proj7  uuid; v_proj8  uuid;

begin

  -- ── Team members ──────────────────────────────────────────

  select id into v_admin from public.users order by created_at limit 1;

  if v_admin is null then
    v_admin := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) values (
      '00000000-0000-0000-0000-000000000000', v_admin,
      'authenticated', 'authenticated',
      'admin@invoke.dev', crypt('password123', gen_salt('bf')),
      now(), '{"provider":"email","providers":["email"]}',
      '{"full_name":"Alex Rivera"}', now(), now()
    );
  end if;

  -- Jordan
  v_jordan := gen_random_uuid();
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    '00000000-0000-0000-0000-000000000000', v_jordan,
    'authenticated', 'authenticated',
    'jordan@invoke.dev', crypt('password123', gen_salt('bf')),
    now(), '{"provider":"email","providers":["email"]}',
    '{"full_name":"Jordan Kim"}', now() - interval '5 days', now()
  );

  -- Priya
  v_priya := gen_random_uuid();
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    '00000000-0000-0000-0000-000000000000', v_priya,
    'authenticated', 'authenticated',
    'priya@invoke.dev', crypt('password123', gen_salt('bf')),
    now(), '{"provider":"email","providers":["email"]}',
    '{"full_name":"Priya Sharma"}', now() - interval '10 days', now()
  );

  -- Carlos
  v_carlos := gen_random_uuid();
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    '00000000-0000-0000-0000-000000000000', v_carlos,
    'authenticated', 'authenticated',
    'carlos@invoke.dev', crypt('password123', gen_salt('bf')),
    now(), '{"provider":"email","providers":["email"]}',
    '{"full_name":"Carlos Mendez"}', now() - interval '15 days', now()
  );

  -- Mia
  v_mia := gen_random_uuid();
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    '00000000-0000-0000-0000-000000000000', v_mia,
    'authenticated', 'authenticated',
    'mia@invoke.dev', crypt('password123', gen_salt('bf')),
    now(), '{"provider":"email","providers":["email"]}',
    '{"full_name":"Mia Okonkwo"}', now() - interval '20 days', now()
  );

  -- ── Clients ───────────────────────────────────────────────

  insert into public.clients (id, name, description, contact_name, contact_email)
  values (gen_random_uuid(), 'Acme Corp', 'Enterprise SaaS platform for logistics', 'Rachel Torres', 'rachel@acmecorp.io')
  returning id into v_acme;

  insert into public.clients (id, name, description, contact_name, contact_email)
  values (gen_random_uuid(), 'TechStart Inc', 'Early-stage startup building developer tooling', 'Marcus Webb', 'marcus@techstart.dev')
  returning id into v_techstart;

  insert into public.clients (id, name, description, contact_name, contact_email)
  values (gen_random_uuid(), 'Meridian Health', 'Healthcare data analytics provider', 'Sofia Nguyen', 'sofia@meridianhealth.com')
  returning id into v_meridian;

  insert into public.clients (id, name, description, contact_name, contact_email)
  values (gen_random_uuid(), 'Blue Wave Media', 'Digital marketing and creative agency', 'Jordan Ellis', 'jordan@bluewavemedia.co')
  returning id into v_bluwave;

  insert into public.clients (id, name, description, contact_name, contact_email)
  values (gen_random_uuid(), 'Forge Robotics', 'Industrial automation and robotics software', 'Ethan Cross', 'ethan@forgerobotics.io')
  returning id into v_forge;

  insert into public.clients (id, name, description, contact_name, contact_email)
  values (gen_random_uuid(), 'Nova Finance', 'Next-gen personal finance and budgeting app', 'Amara Osei', 'amara@novafinance.app')
  returning id into v_nova;

  -- ── Projects ──────────────────────────────────────────────

  insert into public.projects (id, title, description, client_id, status, start_date, end_date, created_by)
  values (gen_random_uuid(), 'Acme Platform Redesign', 'Full redesign of the customer-facing dashboard and onboarding flow.', v_acme, 'active', current_date - 30, current_date + 60, v_admin)
  returning id into v_proj1;

  insert into public.projects (id, title, description, client_id, status, start_date, end_date, created_by)
  values (gen_random_uuid(), 'API v3 Migration', 'Migrate all client integrations from REST v2 to the new GraphQL API.', v_techstart, 'active', current_date - 14, current_date + 45, v_admin)
  returning id into v_proj2;

  insert into public.projects (id, title, description, client_id, status, start_date, end_date, created_by)
  values (gen_random_uuid(), 'Patient Analytics Dashboard', 'Real-time analytics dashboard for patient outcome data.', v_meridian, 'on_hold', current_date - 60, current_date + 10, v_jordan)
  returning id into v_proj3;

  insert into public.projects (id, title, description, client_id, status, start_date, end_date, created_by)
  values (gen_random_uuid(), 'Q3 Campaign Suite', 'Landing pages, email templates, and ad creatives for Q3 push.', v_bluwave, 'active', current_date - 7, current_date + 30, v_priya)
  returning id into v_proj4;

  insert into public.projects (id, title, description, client_id, status, start_date, end_date, created_by)
  values (gen_random_uuid(), 'Internal Design System', 'Shared component library used across all client projects.', null, 'completed', current_date - 90, current_date - 5, v_admin)
  returning id into v_proj5;

  insert into public.projects (id, title, description, client_id, status, start_date, end_date, created_by)
  values (gen_random_uuid(), 'Forge Control Panel', 'Web interface for configuring and monitoring robotic arms on the factory floor.', v_forge, 'active', current_date - 20, current_date + 75, v_carlos)
  returning id into v_proj6;

  insert into public.projects (id, title, description, client_id, status, start_date, end_date, created_by)
  values (gen_random_uuid(), 'Nova Onboarding Redesign', 'Streamline the 7-step signup flow down to 3 steps with inline validation.', v_nova, 'active', current_date - 5, current_date + 40, v_mia)
  returning id into v_proj7;

  insert into public.projects (id, title, description, client_id, status, start_date, end_date, created_by)
  values (gen_random_uuid(), 'Acme Mobile App', 'iOS and Android companion app for the Acme logistics platform.', v_acme, 'on_hold', current_date - 45, current_date + 90, v_jordan)
  returning id into v_proj8;

  -- ── Project members ───────────────────────────────────────

  -- proj1: Acme Redesign — full team
  insert into public.project_members (project_id, user_id, role) values
    (v_proj1, v_jordan, 'member'),
    (v_proj1, v_priya,  'member'),
    (v_proj1, v_mia,    'member');

  -- proj2: API Migration — devs
  insert into public.project_members (project_id, user_id, role) values
    (v_proj2, v_carlos, 'member'),
    (v_proj2, v_jordan, 'member');

  -- proj3: Analytics — jordan owns, priya helps
  insert into public.project_members (project_id, user_id, role) values
    (v_proj3, v_admin,  'member'),
    (v_proj3, v_priya,  'member');

  -- proj4: Campaign — priya owns, mia helps
  insert into public.project_members (project_id, user_id, role) values
    (v_proj4, v_mia,    'member'),
    (v_proj4, v_admin,  'member');

  -- proj5: Design System — admin owns, all contributed
  insert into public.project_members (project_id, user_id, role) values
    (v_proj5, v_jordan, 'member'),
    (v_proj5, v_priya,  'member'),
    (v_proj5, v_carlos, 'member'),
    (v_proj5, v_mia,    'member');

  -- proj6: Forge Control — carlos owns
  insert into public.project_members (project_id, user_id, role) values
    (v_proj6, v_admin,  'member'),
    (v_proj6, v_jordan, 'member'),
    (v_proj6, v_priya,  'member');

  -- proj7: Nova Onboarding — mia owns
  insert into public.project_members (project_id, user_id, role) values
    (v_proj7, v_priya,  'member'),
    (v_proj7, v_carlos, 'member');

  -- proj8: Acme Mobile — jordan owns
  insert into public.project_members (project_id, user_id, role) values
    (v_proj8, v_admin,  'member'),
    (v_proj8, v_mia,    'member');

  -- ── Tasks — Acme Platform Redesign ────────────────────────

  insert into public.tasks (title, description, project_id, status, priority, assignee_id, due_date, start_date, position) values
    ('Audit current UX flows',         'Document pain points in the existing dashboard',       v_proj1, 'done',        'high',   v_admin,  current_date - 20, current_date - 30, 0),
    ('Create wireframes',              'Low-fi wireframes for all core screens',               v_proj1, 'done',        'high',   v_priya,  current_date - 10, current_date - 20, 1),
    ('Design system tokens',           'Define color, spacing, and typography variables',      v_proj1, 'in_review',   'medium', v_mia,    current_date + 2,  current_date - 5,  0),
    ('Onboarding flow redesign',       'New 3-step onboarding with progress indicator',        v_proj1, 'in_progress', 'high',   v_jordan, current_date + 7,  current_date - 2,  0),
    ('Dashboard component library',    'Build reusable card, chart, and table components',     v_proj1, 'in_progress', 'medium', v_priya,  current_date + 14, current_date,      1),
    ('Responsive breakpoints',         'Ensure layouts work at 320px, 768px, 1280px',          v_proj1, 'backlog',     'low',    null,      current_date + 20, null,              0),
    ('Accessibility audit',            'WCAG 2.1 AA compliance check on all screens',          v_proj1, 'backlog',     'medium', v_mia,    current_date + 25, null,              1),
    ('Stakeholder review session',     'Present designs to Acme product team',                 v_proj1, 'backlog',     'urgent', v_admin,  current_date + 30, null,              2);

  -- ── Tasks — API v3 Migration ───────────────────────────────

  insert into public.tasks (title, description, project_id, status, priority, assignee_id, due_date, start_date, position) values
    ('Map existing REST endpoints',    'Document all v2 endpoints and their consumers',        v_proj2, 'done',        'high',   v_carlos, current_date - 10, current_date - 14, 0),
    ('GraphQL schema design',          'Define types, queries, and mutations for v3',          v_proj2, 'in_review',   'high',   v_jordan, current_date + 3,  current_date - 7,  0),
    ('Auth token migration',           'Update JWT claims to support new scope model',         v_proj2, 'in_progress', 'urgent', v_carlos, current_date + 5,  current_date - 2,  0),
    ('SDK client update',              'Publish updated JS and Python SDK clients',            v_proj2, 'backlog',     'high',   v_jordan, current_date + 20, null,              0),
    ('Rate limiting rules',            'Per-client rate limits on the new gateway',            v_proj2, 'backlog',     'medium', null,      current_date + 25, null,              1),
    ('Migration guide docs',           'Write developer-facing migration guide',               v_proj2, 'backlog',     'low',    v_carlos, current_date + 40, null,              2);

  -- ── Tasks — Patient Analytics Dashboard ───────────────────

  insert into public.tasks (title, description, project_id, status, priority, assignee_id, due_date, start_date, position) values
    ('Data pipeline spec',             'Define ETL pipeline from EHR to dashboard DB',        v_proj3, 'done',        'high',   v_jordan, current_date - 45, current_date - 60, 0),
    ('HIPAA compliance review',        'Legal sign-off on data handling approach',             v_proj3, 'in_review',   'urgent', v_priya,  current_date + 5,  current_date - 5,  0),
    ('Chart component prototypes',     'Build prototype charts for patient outcomes',          v_proj3, 'backlog',     'medium', v_admin,  current_date + 15, null,              0),
    ('Filter and date range UI',       'Implement date range picker and filter panel',         v_proj3, 'backlog',     'medium', null,      current_date + 20, null,              1);

  -- ── Tasks — Q3 Campaign Suite ─────────────────────────────

  insert into public.tasks (title, description, project_id, status, priority, assignee_id, due_date, start_date, position) values
    ('Campaign brief review',          'Align on messaging, audience, and goals',              v_proj4, 'done',        'high',   v_priya,  current_date - 5,  current_date - 7,  0),
    ('Landing page design',            '3 variants for A/B testing',                           v_proj4, 'in_progress', 'high',   v_mia,    current_date + 8,  current_date,      0),
    ('Email template set',             '5 templates: welcome, nurture x3, promo',              v_proj4, 'in_progress', 'medium', v_priya,  current_date + 10, current_date + 1,  1),
    ('Social ad creatives',            '1080x1080 and 1200x628 variants per campaign',         v_proj4, 'backlog',     'medium', v_mia,    current_date + 15, null,              0),
    ('Analytics tracking setup',       'GA4 events and UTM parameter plan',                   v_proj4, 'backlog',     'low',    null,      current_date + 20, null,              1);

  -- ── Tasks — Internal Design System ────────────────────────

  insert into public.tasks (title, description, project_id, status, priority, assignee_id, due_date, start_date, position) values
    ('Component inventory',            'Audit all components used across projects',            v_proj5, 'done', 'medium', v_admin,  current_date - 70, current_date - 90, 0),
    ('Figma token library',            'Set up design tokens in Figma',                        v_proj5, 'done', 'high',   v_priya,  current_date - 50, current_date - 70, 1),
    ('Button & form components',       'Build core interactive components',                    v_proj5, 'done', 'high',   v_carlos, current_date - 30, current_date - 50, 2),
    ('Documentation site',             'Storybook-style docs for all components',              v_proj5, 'done', 'medium', v_jordan, current_date - 10, current_date - 25, 3),
    ('Publish to npm',                 'Package and publish @invoke/ui to internal registry',  v_proj5, 'done', 'high',   v_admin,  current_date - 5,  current_date - 10, 4);

  -- ── Tasks — Forge Control Panel ───────────────────────────

  insert into public.tasks (title, description, project_id, status, priority, assignee_id, due_date, start_date, position) values
    ('Requirements gathering',         'Workshop with Forge engineering team',                 v_proj6, 'done',        'high',   v_carlos, current_date - 18, current_date - 20, 0),
    ('System architecture doc',        'Define frontend-backend interface for robot commands', v_proj6, 'done',        'high',   v_jordan, current_date - 12, current_date - 18, 1),
    ('Real-time telemetry feed',       'WebSocket stream for arm position and load data',      v_proj6, 'in_progress', 'urgent', v_carlos, current_date + 10, current_date - 5,  0),
    ('3D arm visualizer',              'Three.js visualization of robot joint states',         v_proj6, 'in_progress', 'high',   v_jordan, current_date + 14, current_date - 2,  1),
    ('Alert & threshold config UI',    'Let operators set warning/critical thresholds',        v_proj6, 'in_review',   'medium', v_priya,  current_date + 5,  current_date - 8,  0),
    ('Command history log',            'Paginated table of all sent commands with status',     v_proj6, 'backlog',     'medium', null,      current_date + 25, null,              0),
    ('Access control / roles',         'Admin vs operator vs read-only permission tiers',      v_proj6, 'backlog',     'high',   v_carlos, current_date + 30, null,              1),
    ('E2E test suite',                 'Playwright tests for critical control flows',          v_proj6, 'backlog',     'low',    null,      current_date + 40, null,              2);

  -- ── Tasks — Nova Onboarding Redesign ──────────────────────

  insert into public.tasks (title, description, project_id, status, priority, assignee_id, due_date, start_date, position) values
    ('Heuristic review of current flow','Identify friction points in existing 7-step signup',  v_proj7, 'done',        'high',   v_mia,    current_date - 3,  current_date - 5,  0),
    ('User interview synthesis',       'Synthesize findings from 8 user interviews',           v_proj7, 'in_progress', 'high',   v_priya,  current_date + 4,  current_date,      0),
    ('New flow wireframes',            '3-step flow: account, profile, goals',                 v_proj7, 'in_progress', 'medium', v_mia,    current_date + 8,  current_date + 1,  1),
    ('Inline validation logic',        'Real-time field validation without full form submit',  v_proj7, 'backlog',     'high',   v_carlos, current_date + 15, null,              0),
    ('Progress indicator component',   'Animated step indicator matching Nova brand',          v_proj7, 'backlog',     'medium', v_mia,    current_date + 18, null,              1),
    ('A/B test plan',                  'Define metrics and rollout % for new vs old flow',     v_proj7, 'backlog',     'medium', null,      current_date + 25, null,              2),
    ('QA across devices',              'Test on iOS, Android, and desktop viewports',          v_proj7, 'backlog',     'low',    null,      current_date + 35, null,              3);

  -- ── Tasks — Acme Mobile App ───────────────────────────────

  insert into public.tasks (title, description, project_id, status, priority, assignee_id, due_date, start_date, position) values
    ('Scoping & estimation',           'Break down features into t-shirt sized epics',         v_proj8, 'done',        'high',   v_jordan, current_date - 40, current_date - 45, 0),
    ('Tech stack decision',            'React Native vs Flutter evaluation',                   v_proj8, 'done',        'high',   v_admin,  current_date - 30, current_date - 40, 1),
    ('Design exploration',             'High-level UI concepts for mobile-first workflows',    v_proj8, 'in_review',   'medium', v_mia,    current_date + 7,  current_date - 10, 0),
    ('Auth & session flow',            'Implement biometric + email login for mobile',         v_proj8, 'backlog',     'urgent', v_jordan, current_date + 20, null,              0),
    ('Shipment tracking screen',       'Real-time map view for active logistics shipments',    v_proj8, 'backlog',     'high',   null,      current_date + 35, null,              1),
    ('Push notification setup',        'FCM integration for delivery alerts',                  v_proj8, 'backlog',     'medium', null,      current_date + 40, null,              2),
    ('Offline mode',                   'Cache last 24h of shipment data for offline access',   v_proj8, 'backlog',     'low',    null,      current_date + 60, null,              3);

  -- Add any extra registered users (e.g. from a prior signup) to all projects
  insert into public.project_members (project_id, user_id, role)
  select p.id, u.id, 'owner'
  from public.projects p
  cross join public.users u
  where u.id not in (v_admin, v_jordan, v_priya, v_carlos, v_mia)
  on conflict do nothing;

  raise notice 'Seed complete — 5 users, 6 clients, 8 projects, % tasks.',
    (select count(*) from public.tasks where project_id in
      (v_proj1, v_proj2, v_proj3, v_proj4, v_proj5, v_proj6, v_proj7, v_proj8));

end $$;
