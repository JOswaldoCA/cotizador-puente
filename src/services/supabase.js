import { createClient } from '@supabase/supabase-js'

const url = 'https://opsfwaippowqaervbvxe.supabase.co'
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wc2Z3YWlwcG93cWFlcnZidnhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczMTMxNzMsImV4cCI6MjA5Mjg4OTE3M30.NhvpSwgKcStdjYoP8GwDttIOTs_VgM6JtmEoexkmd14'

export const supabase = createClient(url, key)