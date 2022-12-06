import z3
import time

# Generate all constraints for one dimension
def constraints_one_dim(solver, constraints, other_dim_len, identifier='v'):
    result = []
    
    # List of new constraint
    for line_num in range(len(constraints)):
        last_var = None
        new_vars = []
        
        # Used for computing the improved range constraint
        max_start = other_dim_len - (sum(constraints[line_num]) + len(constraints[line_num]) - 1)
        min_start = 0
        
        # List of new variables
        for span_num in range(len(constraints[line_num])):            
            # For each number, create new var denoting the start index
            new_var = z3.Int("%s_%s_%s" % (identifier, line_num, span_num))
            
            # Regular range constraint
            solver.add(z3.And(new_var >= 0, new_var < other_dim_len))
            
            # Improved range constraint similar to the Simple Box Rule here: https://en.wikipedia.org/wiki/Nonogram
            solver.add(z3.And(new_var >= min_start, new_var <= max_start))
            
            # Order + Gap constraint
            if last_var != None:
                solver.add(last_var+constraints[line_num][span_num-1] < new_var)
            
            min_start = min_start + constraints[line_num][span_num] + 1
            max_start = max_start + constraints[line_num][span_num] + 1
            last_var = new_var
            new_vars.append(new_var)    
        result.append(new_vars)
    return result

# Generate all constraints for each cell
def constraints_cells(solver, row_vars, col_vars, row_len, col_len):
    # Generate all vars for each cell - easy for output, not necessary
    board = []
    for row_num in range(row_len):
        row = [z3.Bool('c_%s_%s' % (row_num, col_num)) for col_num in range(col_len)]
        board.append(row)
    
    # Generate consistency constraints
    for row_num in range(row_len):
        for col_num in range(col_len):
            # Either this cell is empty - no equality exists
            empty_cond_row = [z3.Or(row_vars[row_num][i] > col_num, row_vars[row_num][i] + row_constraints[row_num][i] <= col_num) 
                              for i in range(len(row_vars[row_num]))]
            empty_cond_col = [z3.Or(col_vars[col_num][i] > row_num, col_vars[col_num][i] + col_constraints[col_num][i] <= row_num) 
                              for i in range(len(col_vars[col_num]))]
            empty = z3.And(*empty_cond_row, *empty_cond_col)
            
            # Or this cell is filled - required by both row and col vars
            taken_cond_row = [z3.And(row_vars[row_num][i] <= col_num, row_vars[row_num][i] + row_constraints[row_num][i] > col_num) 
                              for i in range(len(row_vars[row_num]))]
            taken_cond_col = [z3.And(col_vars[col_num][i] <= row_num, col_vars[col_num][i] + col_constraints[col_num][i] > row_num) 
                              for i in range(len(col_vars[col_num]))]
            taken = z3.And(z3.Or(*taken_cond_row), z3.Or(*taken_cond_col))
            
            # Record result
            board[row_num][col_num] = taken
            solver.add(z3.Or(empty, taken))
    return board

start = time.perf_counter()
s = z3.Solver()

row_constraints = [[1,1,1],[1,1],[4,1],[1,1,1],[1,1,1]]
col_constraints = [[],[5],[1],[1],[5],[],[1,3],[]]
row_len = len(row_constraints)
col_len = len(col_constraints)
row_vars = constraints_one_dim(s, row_constraints, col_len, 'r')
col_vars = constraints_one_dim(s, col_constraints, row_len, 'c')
board = constraints_cells(s, row_vars, col_vars, row_len, col_len)

if s.check() == z3.sat:
    m = s.model()
    # print(m)
    for row_num in range(row_len):
        for col_num in range(col_len):
            if m.evaluate(board[row_num][col_num]):
                print(' ', end='')
            else:
                print('\u2588', end='')
        print()
else:
    print("unsat")
end = time.perf_counter()
print("Time:", (end-start), "s")