// require('fastify'): This uses Node.js's require() function to import the Fastify module.
// Fastify is a web framework that is designed to be fast and low-overhead, used to create web servers or APIs in Node.js.
// logger: This enables the logging feature of Fastify, which logs all incoming requests and their responses.

//For starting the project what we need :
// 1.npm init -y
// npm install fastify mysql2 

const fastify = require('fastify')({ logger: true })// Fastify framework with logging enabled
const mysql = require('mysql2/promise'); //Mysql client promises for asynchronous DB operations
const formBody = require('@fastify/formbody'); // Import the formbody plugin

fastify.register(formBody); // Register the plugin




// Create a connection pool for MySQL to allow multiple queries to run
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'Shaikh@786',
    database: 'mavonic'

})

// Make the db connection avalaible throughout the fastify app
fastify.decorate('db', db); 

// A simple route to test the if the server is runnning
fastify.get('/', async (request, reply) => {
    reply.send({ hello: 'world, Your mavonic project is running'})
})


// Endpoint to create a new employee (POST/ employees)
fastify.post('/employees', async (request,reply) => {
    // Destructure the employee details from the request body
    const { name, email, designation, department, date_of_joining } = request.body;

    // Insert the employee details into the databse
    const [result] = await fastify.db.execute(
        'INSERT INTO employees (name, email, designation, department, date_of_joining) VALUES (?, ?, ?, ?, ?)',
        [name, email, designation, department, date_of_joining]
    );

    // Send back the newly created employee Id and basic details
    reply.code(201).send({id: result.insertId, name, email});
});


// Endpint to get a single employee by their ID (Get / employee/:id)
fastify.get('/employees/:id', async (request, reply) =>{
    const { id } = request.params; // Extract employee ID from the URl parameter

    // Execute a query to fetch the employee with the specific Id
    const [rows] = await fastify.db.execute('Select * from employees where id = ?', [id]);

    // If no employee is found , return a 404 status with an error message
    if (rows.length === 0) {
        return reply.code(404).send({ message : 'Employee not found'});
    }
    reply.send(rows[0]);

});




// Endpoint to update an employee deails (PUT/employees/:id)
fastify.put('/employees/:id', async (request, reply) =>{
    const { id } = request.params;
    const { name, email, designation, department, date_of_joining} = request.body;

    // Update the employee information in the database
    await fastify.db.execute(
        'UPDATE employees SET name = ?, email = ?, designation = ?, department = ?, date_of_joining = ? WHERE id = ?',
        [name, email, designation, department, date_of_joining, id]
    );

    // Send A sucess message
    reply.send({ message: 'Employee updated successfully'});
});



fastify.delete('/employees/:id', async (request, reply) => {
    const { id } = request.params;  // Access the ID from the URL params
    
    try {
      const result = await fastify.mysql.query('DELETE FROM employees WHERE id = ?', [id]);
  
      if (result[0].affectedRows === 0) {
        return reply.code(404).send({ message: `User id ${id} does not exist` });
      }
  
      reply.send({ message: `User id ${id} has been deleted successfully` });
    } catch (err) {
      reply.code(500).send({ error: 'Internal Server Error', message: err.message });
    }
});



// Roles Endpoint
fastify.post('/roles', async (request, reply) => {
  // Destructure role details from the request body
  const { id = null, role_name } = request.body;

  if (!role_name) {
    return reply.code(400).send({ error: 'Role name is required' });
  }

  try {
    // Insert role details into the database
    const [result] = await fastify.db.execute(
      'INSERT INTO Roles (id, role_name) VALUES (?, ?)',
      [id, role_name]
    );

    // Send back the newly created role ID and role name
    reply.code(201).send({ id: result.insertId, role_name });
  } catch (error) {
    // Handle any database error
    reply.code(500).send({ error: 'Database insertion failed', details: error.message });
  }
});


// This Route will get all the roles from the database
fastify.get('/roles', async (request, reply) => {
  try {
    // Execute SQL query to get all roles
    const [rows] = await fastify.db.query('SELECT * FROM Roles');
    
    // Send the result back
    reply.code(200).send(rows);
  } catch (error) {
    // Handle any errors
    reply.code(500).send({ error: 'Internal Server Error', message: error.message });
  }
});


// Role update endpoint
fastify.put('/roles/:id', async (request, reply) => {
  const { id } = request.params; // This id is used to identify the role to update
  const { role_name } = request.body; // Extract only role_name from the body

  try {
    // Update the role_name in the database where id matches the request param id
    await fastify.db.execute(
      'UPDATE roles SET role_name = ? WHERE id = ?',
      [role_name, id] // role_name from body, id from params
    );

    // Send a success message
    reply.send({ message: 'Role updated successfully' });
  } catch (error) {
    // Handle potential errors (e.g., database errors)
    reply.code(500).send({ error: 'Failed to update the role' });
  }
});




fastify.register(require('@fastify/mysql'), {
  promise: true,
  connectionString: 'mysql://root:Shaikh@786@localhost/mavonic'
});


// Role delete endpoint
fastify.delete('/roles/:id', async (request, reply) => {
  const { id } = request.params;  // Access the ID from the URL params

  try {
    // Make sure the connection is established and query is valid
    const [result] = await fastify.mysql.query('DELETE FROM roles WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return reply.code(404).send({ message: `Role id ${id} does not exist` });
    }

    reply.send({ message: `Role id ${id} has been deleted successfully` });
  } catch (err) {
    console.error('Error during DELETE:', err);  // Log detailed error
    reply.code(500).send({ error: 'Internal Server Error', message: err.message });
  }
});




// For Projects Endpoint
fastify.post('/projects', async (request, reply) => {
  // Destructure the employee details from the request body
  const {
    id,
    Project_name,
    Start_Date,
    End_Date,
    Description,
    Status,
    Employee_Id
  } = request.body;

  // Ensure undefined values are replaced with null
  const projectId = id || null;
  const projectName = Project_name || null;
  const startDate = Start_Date || null;
  const endDate = End_Date || null;
  const description = Description || null;
  const status = Status || null;
  const employeeId = Employee_Id || null;

  try {
    // Insert the project details into the database
    const [result] = await fastify.db.execute(
      'INSERT INTO Projects (id, Project_name, Start_Date, End_Date, Description, Status, Employee_Id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [projectId, projectName, startDate, endDate, description, status, employeeId]
    );

    // Send back the newly created project ID and basic details
    reply.code(201).send({
      id: result.insertId,
      Project_name: projectName,
      Start_Date: startDate,
      End_Date: endDate,
      Description: description,
      Status: status,
      Employee_Id: employeeId
    });
  } catch (err) {
    // Handle the error
    reply.code(500).send({ error: 'Internal Server Error', message: err.message });
  }
});

// For Projects Endpoint Get
fastify.get('/projects', async (request, reply) => {
  try {
    // Execute SQL query to get all roles
    const [rows] = await fastify.db.query('SELECT * FROM projects');
    
    // Send the result back
    reply.code(200).send(rows);
  } catch (error) {
    // Handle any errors
    reply.code(500).send({ error: 'Internal Server Error', message: error.message });
  }
});




fastify.put('/projects/:id', async (request, reply) => {
  const { id } = request.params; // ID of the project to be updated
  const { Project_name, Start_Date, End_Date, Description, Status, Employee_Id } = request.body; // Extract fields from request body

  // Check if at least one field to update is provided
  if (!Project_name && !Start_Date && !End_Date && !Description && !Status && !Employee_Id) {
    return reply.code(400).send({ error: 'No fields provided to update' });
  }

  try {
    // Construct the SQL query dynamically based on provided fields
    let fieldsToUpdate = [];
    let values = [];

    if (Project_name) {
      fieldsToUpdate.push('Project_name = ?');
      values.push(Project_name);
    }
    if (Start_Date) {
      fieldsToUpdate.push('Start_Date = ?');
      values.push(Start_Date);
    }
    if (End_Date) {
      fieldsToUpdate.push('End_Date = ?');
      values.push(End_Date);
    }
    if (Description) {
      fieldsToUpdate.push('Description = ?');
      values.push(Description);
    }
    if (Status) {
      fieldsToUpdate.push('Status = ?');
      values.push(Status);
    }
    if (Employee_Id) {
      fieldsToUpdate.push('Employee_Id = ?');
      values.push(Employee_Id);
    }

    // Add the project ID at the end for the WHERE clause
    values.push(id);

    const sqlQuery = `UPDATE Projects SET ${fieldsToUpdate.join(', ')} WHERE id = ?`;

    // Execute the update query
    await fastify.db.execute(sqlQuery, values);

    // Send a success message
    reply.send({ message: 'Project updated successfully' });
  } catch (error) {
    // Handle potential errors (e.g., database errors)
    reply.code(500).send({ error: 'Failed to update the Project', message: error.message });
  }
});

//Delete Endpoint
fastify.delete('/projects/:id', async (request, reply) => {
  const { id } = request.params; // Access the ID from the URL params
  try {
    // Make sure the connection is established and query is valid
    const [result] = await fastify.mysql.query('DELETE FROM projects WHERE id = ?', [id]);
  } catch (err) {
    console.error('Error during DELETE:', err); // Log detailed error
  }
  // if (result.affectedRows === 0) {
  //   return reply.code(404).send({ message: `Project id ${id} does not exist` });

  // }
  reply.send({ message: `Project id ${id} has been deleted successfully` });
})

// For Assign Project
fastify.post('/assign-project', async (request, reply) => {
  const { Employee_Id, Project_Id, Role_Id } = request.body; // Extract employee, project, and role IDs

  // Check if all fields are provided
  if (!Employee_Id || !Project_Id || !Role_Id) {
    return reply.code(400).send({ error: 'Employee_Id, Project_Id, and Role_Id are required' });
  }

  try {
    // Insert assignment into ProjectAssignments table
    const [result] = await fastify.db.execute(
      'INSERT INTO ProjectAssignments (Employee_Id, Project_Id, Role_Id) VALUES (?, ?, ?)',
      [Employee_Id, Project_Id, Role_Id]
    );

    // Send back success message with assignment ID
    reply.code(201).send({ message: 'Employee assigned to project successfully', assignmentId: result.insertId });
  } catch (error) {
    // Handle potential errors (e.g., foreign key constraint violations)
    reply.code(500).send({ error: 'Failed to assign employee to project', message: error.message });
  }
});




const start = async () => {
    try {
      await fastify.listen({ port: 3000 });
      fastify.log.info(`Server is running at http://localhost:3000`);
    } catch (err) {
      fastify.log.error(err);
      process.exit(1);
    }
  };
  
  start();






