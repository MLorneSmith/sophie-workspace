-- Create a function to insert a certificate record and return the ID
CREATE OR REPLACE FUNCTION public.insert_certificate(
  p_user_id UUID,
  p_course_id TEXT,
  p_file_path TEXT
)
RETURNS TABLE (id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_certificate_id UUID;
BEGIN
  -- Insert the certificate record
  INSERT INTO public.certificates (user_id, course_id, file_path)
  VALUES (p_user_id, p_course_id, p_file_path)
  RETURNING certificates.id INTO v_certificate_id;
  
  -- Return the certificate ID
  RETURN QUERY SELECT v_certificate_id;
END;
$$;

-- Set the security permissions for the function
ALTER FUNCTION public.insert_certificate(UUID, TEXT, TEXT) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.insert_certificate(UUID, TEXT, TEXT) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.insert_certificate(UUID, TEXT, TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.insert_certificate(UUID, TEXT, TEXT) FROM public;
