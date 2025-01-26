class TopologicalSortValidator {
    constructor() {
        this.graph = new Map();
        this.vertices = new Set();
        this.fromVertexSelect = document.getElementById('from-vertex-select');
        this.addVertexInput = document.getElementById('add-vertex-input');
        this.toVertexInput = document.getElementById('to-vertex-input');
        this.edgesContainer = document.getElementById('edges-container');
        this.sortingResult = document.getElementById('sorting-result');
        this.graphSvg = d3.select('#graph-svg');
    }

    clearGraph() {
        this.graph.clear();
        this.vertices.clear();
        this.fromVertexSelect.innerHTML = '<option value="">From Vertex</option>';
        this.edgesContainer.innerHTML = '';
        this.sortingResult.innerHTML = '';
        this.renderGraph();
    }

    addVertex() {
        const vertexName = this.addVertexInput.value.trim().toUpperCase();
        
        if (!vertexName) {
            alert('Please enter a vertex name!');
            return;
        }

        if (this.vertices.has(vertexName)) {
            alert('Vertex already exists!');
            return;
        }

        this.vertices.add(vertexName);
        this.graph.set(vertexName, []);
        this.updateVertexSelector();
        this.addVertexInput.value = '';
        this.renderGraph();
    }

    updateVertexSelector() {
        this.fromVertexSelect.innerHTML = '<option value="">From Vertex</option>';
        this.vertices.forEach(vertex => {
            const option = document.createElement('option');
            option.value = vertex;
            option.textContent = vertex;
            this.fromVertexSelect.appendChild(option);
        });
    }

    addEdge() {
        const fromVertex = this.fromVertexSelect.value;
        const toVertex = this.toVertexInput.value.trim().toUpperCase();

        if (!fromVertex || !toVertex) {
            alert('Please select a FROM vertex and enter a TO vertex!');
            return;
        }

        if (fromVertex === toVertex) {
            alert('Cannot create an edge to the same vertex!');
            return;
        }

        if (!this.vertices.has(toVertex)) {
            this.vertices.add(toVertex);
            this.graph.set(toVertex, []);
            this.updateVertexSelector();
        }

        if (!this.graph.get(fromVertex).includes(toVertex)) {
            this.graph.get(fromVertex).push(toVertex);
            this.updateEdgesDisplay();
            this.renderGraph();
        } else {
            alert('Edge already exists!');
        }

        this.toVertexInput.value = '';
    }

    updateEdgesDisplay() {
        this.edgesContainer.innerHTML = '';
        this.graph.forEach((neighbors, vertex) => {
            neighbors.forEach(neighbor => {
                const edgeElement = document.createElement('div');
                edgeElement.classList.add('edge');
                edgeElement.textContent = `${vertex} → ${neighbor}`;
                this.edgesContainer.appendChild(edgeElement);
            });
        });
    }

    renderGraph() {
        this.graphSvg.selectAll("*").remove();
        const width = 800;
        const height = 400;

        const nodes = Array.from(this.vertices).map(v => ({id: v}));
        const links = [];

        this.graph.forEach((neighbors, vertex) => {
            neighbors.forEach(neighbor => {
                links.push({source: vertex, target: neighbor});
            });
        });

        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id(d => d.id))
            .force("charge", d3.forceManyBody().strength(-300))
            .force("center", d3.forceCenter(width / 2, height / 2));

        const link = this.graphSvg
            .append("g")
            .selectAll("line")
            .data(links)
            .enter().append("line")
            .attr("stroke", "#3498db")
            .attr("stroke-width", 2)
            .attr("marker-end", "url(#arrowhead)");

        const node = this.graphSvg
            .append("g")
            .selectAll("circle")
            .data(nodes)
            .enter().append("circle")
            .attr("r", 20)
            .attr("fill", "#2ecc71");

        const label = this.graphSvg
            .append("g")
            .selectAll("text")
            .data(nodes)
            .enter().append("text")
            .text(d => d.id)
            .attr("font-size", 12)
            .attr("fill", "white")
            .attr("text-anchor", "middle")
            .attr("alignment-baseline", "middle");

        // Arrowhead marker
        this.graphSvg.append("defs")
            .append("marker")
            .attr("id", "arrowhead")
            .attr("viewBox", "-0 -5 10 10")
            .attr("refX", 30)
            .attr("refY", 0)
            .attr("orient", "auto")
            .attr("markerWidth", 6)
            .attr("markerHeight", 6)
            .append("path")
            .attr("d", "M 0,-5 L 10 ,0 L 0,5")
            .attr("fill", "#3498db");

        simulation.on("tick", () => {
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            node
                .attr("cx", d => d.x)
                .attr("cy", d => d.y);

            label
                .attr("x", d => d.x)
                .attr("y", d => d.y);
        });
    }

    generateRandomGraph() {
        this.clearGraph();
        const vertices = ['A', 'B', 'C', 'D', 'E', 'F'];
        const edges = [
            ['A', 'B'], ['A', 'C'], 
            ['B', 'D'], ['C', 'D'], 
            ['D', 'E'], ['E', 'F']
        ];

        // Add vertices
        vertices.forEach(v => {
            this.vertices.add(v);
            this.graph.set(v, []);
        });

        // Add edges
        edges.forEach(([from, to]) => {
            this.graph.get(from).push(to);
        });

        this.updateVertexSelector();
        this.updateEdgesDisplay();
        this.renderGraph();
    }

    detectCycle() {
        const visited = new Set();
        const recursionStack = new Set();

        const dfs = (vertex) => {
            if (recursionStack.has(vertex)) return true;
            if (visited.has(vertex)) return false;

            visited.add(vertex);
            recursionStack.add(vertex);

            for (const neighbor of this.graph.get(vertex) || []) {
                if (dfs(neighbor)) return true;
            }

            recursionStack.delete(vertex);
            return false;
        };

        for (const vertex of this.vertices) {
            if (dfs(vertex)) return true;
        }
        return false;
    }

    validateTopologicalSort() {
        // Check if graph is empty
        if (this.vertices.size === 0) {
            this.displayResult(false, 'Graph is empty. Please add vertices and edges.');
            return;
        }

        // Check for cycles
        if (this.detectCycle()) {
            this.displayResult(false, 'Graph contains a cycle. Topological sort is impossible.');
            return;
        }

        // Prompt for user's proposed sorting
        const userSortInput = prompt('Enter the proposed topological sort (comma-separated vertices):');
        if (!userSortInput) {
            this.displayResult(false, 'No input provided.');
            return;
        }

        const userSort = userSortInput.split(',')
            .map(v => v.trim().toUpperCase())
            .filter(v => v !== '');

        // Step 1: Check if all vertices are present
        const sortSet = new Set(userSort);
        const missingVertices = [...this.vertices].filter(v => !sortSet.has(v));
        
        if (missingVertices.length > 0) {
            this.displayResult(false, `Missing vertices: ${missingVertices.join(', ')}`);
            return;
        }

        // Step 2: Check for extra vertices
        const extraVertices = userSort.filter(v => !this.vertices.has(v));
        if (extraVertices.length > 0) {
            this.displayResult(false, `Extra vertices: ${extraVertices.join(', ')}`);
            return;
        }

        // Step 3: Check order constraints
        const invalidEdges = [];
        for (const [vertex, neighbors] of this.graph.entries()) {
            const vertexIndex = userSort.indexOf(vertex);
            
            for (const neighbor of neighbors) {
                const neighborIndex = userSort.indexOf(neighbor);
                
                if (vertexIndex > neighborIndex) {
                    invalidEdges.push(`${vertex} → ${neighbor}`);
                }
            }
        }

        if (invalidEdges.length > 0) {
            this.displayResult(false, `Invalid order for edges: ${invalidEdges.join(', ')}`);
            return;
        }

        // If all checks pass
        this.displayResult(true, 'Congratulations! Your topological sort is correct!');
    }

    displayResult(isCorrect, message) {
        const resultDiv = this.sortingResult;
        resultDiv.innerHTML = `
            <div class="${isCorrect ? 'win-message' : 'loss-message'}">
                ${message}
            </div>
        `;
    }
}

const game = new TopologicalSortValidator();
