module.exports = function(RED) {
    var mysql = require('mysql');
    function MySqlNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        node.on('input', function(msg) {
            //var client_id = msg.req.query.client_id;
            var connection = mysql.createConnection({
                host     : msg.payload['host'],
                user     : msg.payload['username'],
                password : msg.payload['password'],
                database : msg.payload['dbname']
            });
            var client_id =  msg.payload['client_id'];
            var task_id =  msg.payload['task_id'];
            var project_id =  msg.payload['project_id'];
            var user_id =  msg.payload['user_id'];
            var time =  msg.payload['time'];


            //console.log('msg.payload===>',msg.payload);

            
            var fulltime = time.split(':');
            var hours = parseInt(fulltime[0] * 60);
            var minutes = parseInt(fulltime[1]);
            var totaltime = (hours + minutes);
            totaltime = totaltime/60;
            totaltime = totaltime.toFixed(2);       
            

            var today = new Date();
            //var dd = (today.getDate()).toString().padStart(2, '0');
            //var mm = (today.getMonth() + 1).toString().padStart(2, '0'); //January is 0!
            var mm=((today.getMonth()+1)>=10)? (today.getMonth()+1) : '0' + (today.getMonth()+1);  
            var dd=((today.getDate())>=10)? (today.getDate()) : '0' + (today.getDate());

            var yyyy = today.getFullYear();
                dd = parseInt(dd); 
                mm = parseInt(mm);
                yyyy = parseInt(yyyy);        
            var dateTime = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();            

            today = yyyy + '-' + mm + '-' + dd;
            dateTime = today+' '+dateTime;

            Date.prototype.getWeek = function() {
                var onejan = new Date(this.getFullYear(), 0, 1);
                return Math.ceil((((this - onejan) / 86400000) + onejan.getDay() + 1) / 7);
            }    
            var weekNumber = parseInt((new Date()).getWeek());


                        
                        connection.beginTransaction(function(err) {
                          console.log(' connection beginTransaction ');
                          if (err) { 
                            console.log(' connection beginTransaction err',err);
                            msg.statusCode = 400;
                            msg.payload = {"error": true, errorMessage: JSON.stringify(err)};
                            node.send(msg);
                          }

                            var time_entries_formData = {
                                project_id: project_id,
                                user_id: user_id,
                                work_package_id: task_id,
                                hours: totaltime,
                                comments: time,
                                activity_id: 1,
                                spent_on: today,
                                tyear: yyyy,
                                tmonth: mm,
                                tweek: weekNumber,
                                created_on: dateTime,
                                updated_on: dateTime,
                            };

                          connection.query('INSERT INTO time_entries SET ?', time_entries_formData, function (error, results, fields) {
                            if (error) {
                              console.log(' time_entries error');  
                              return connection.rollback(function() {
                                console.log(' time_entries statusCode 400',error);                                 
                                msg.statusCode = 400;
                                msg.payload = {"error": true, errorMessage: JSON.stringify(error)};
                                node.send(msg);

                              });
                            }                            

                            var journals_formData = {
                                journable_type: "TimeEntry",
                                journable_id: results.insertId,
                                user_id: user_id,
                                notes: time,                                
                                version: 1,
                                activity_type: "time_entries",
                                created_at: dateTime,
                            };
                         
                            connection.query('INSERT INTO journals SET ?', journals_formData, function (error, results, fields) {
                                if (error) {
                                    console.log(' journals error'); 
                                    return connection.rollback(function() {
                                    console.log(' journals statusCode 400');                                      
                                        msg.statusCode = 400;
                                        msg.payload = {"error": true, errorMessage: JSON.stringify(error)};
                                        node.send(msg);                                      
                                    });
                                }

                                var time_entry_journals_formData = {                                    
                                    journal_id: results.insertId,
                                    project_id: project_id,
                                    user_id: user_id,
                                    work_package_id: task_id,
                                    hours: totaltime,
                                    comments: time,
                                    activity_id: 1,
                                    spent_on: today,
                                    tyear: yyyy,
                                    tmonth: mm,
                                    tweek: weekNumber,
                                };

                                connection.query('INSERT INTO time_entry_journals SET ?', time_entry_journals_formData, function (error, results, fields) {
                                  if (error) {
                                    console.log(' time_entry_journals  error'); 
                                    return connection.rollback(function() {
                                        //throw error;
                                        console.log(' time_entry_journals statusCode 400'); 
                                        msg.statusCode = 400;
                                        msg.payload = {"error": true, errorMessage: JSON.stringify(error)};
                                        node.send(msg);                                      
                                    });
                                  }

                                  connection.commit(function(err) {
                                    if (err) {
                                        console.log(' connection commit error');
                                      return connection.rollback(function() {
                                        console.log(' connection commit statusCode 400'); 
                                        msg.statusCode = 400;
                                        msg.payload = {"error": true, errorMessage: JSON.stringify(err)};
                                        node.send(msg);
                                      });
                                    }
                                    msg.statusCode = 200;
                                    msg.payload = {"error":false, errorMessage: null,success: true};
                                    node.send(msg);
                                  });

                              });

                            });

                          });
                        });
                        



















        });
    }
    RED.nodes.registerType("timeentry",MySqlNode);
}
