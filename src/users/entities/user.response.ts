interface UserWithProfileName {
  user_id: number;

  user_name: string;

  user_email: string;

  user_status: boolean;

  profile_name?: string;
}

export { UserWithProfileName };
