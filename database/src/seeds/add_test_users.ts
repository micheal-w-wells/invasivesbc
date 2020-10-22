import * as Knex from 'knex';

const DB_SCHEMA = process.env.DB_SCHEMA || 'invasivesbc';

const TestUsers = [
  {
    application_users: {
      email: 'istest1@gov.bc.ca',
      preferred_username: 'istest1@idir',
      first_name: 'Test',
      last_name: 'Idr1'
    },
    user_role: {
      role_code_id: 1
    }
  },
  {
    application_users: {
      email: 'istest2@gov.bc.ca',
      preferred_username: 'istest2@idir',
      first_name: 'Test',
      last_name: 'Idr2'
    },
    user_role: {
      role_code_id: 6
    }
  },
  {
    application_users: {
      email: 'istest3@gov.bc.ca',
      preferred_username: 'istest3@idir',
      first_name: 'Test',
      last_name: 'Idr3'
    },
    user_role: {
      role_code_id: 3
    }
  },
  {
    application_users: {
      email: 'istest4@gov.bc.ca',
      preferred_username: 'istest4@idir',
      first_name: 'Test',
      last_name: 'Idr3'
    },
    user_role: {
      role_code_id: 5
    }
  },
  {
    application_users: {
      email: 'istest5@gov.bc.ca',
      preferred_username: 'istest5@idir',
      first_name: 'Test',
      last_name: 'Idr5'
    },
    user_role: {
      role_code_id: 2
    }
  }
];

export async function seed(knex: Knex): Promise<void> {
  // Insert the `application_user` records, returning their email and generated `user_id`
  const applicationUsers = await knex(`${DB_SCHEMA}.application_user`)
    .insert(TestUsers.map((testUser) => testUser.application_users))
    .returning(['user_id', 'email']);

  // Match the returned `application_user` records to their corresponding `TestUsers` entry, and grab the
  // associated `role_code_id`
  const user_roles = applicationUsers.map((applicationUser) => {
    return {
      user_id: applicationUser.user_id,
      role_code_id: TestUsers.find((testUser) => testUser.application_users.email === applicationUser.email).user_role
        .role_code_id
    };
  });

  // Insert the `user_roles` records
  await knex(`${DB_SCHEMA}.user_role`).insert(user_roles);
}
