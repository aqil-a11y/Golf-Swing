create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text,
  last_name text,
  golfer_level text check (golfer_level in ('Beginner', 'Casual', 'Intermediate', 'Advanced', 'Scratch', 'Professional')),
  handicap numeric(4,1) check (handicap >= 0 and handicap <= 54),
  dominant_hand text check (dominant_hand in ('Right', 'Left')),
  home_course text,
  years_playing integer check (years_playing >= 0),
  primary_goal text check (primary_goal in ('Lower my handicap', 'Improve consistency', 'Add distance', 'Learn the basics')),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can insert their own profile" on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);
