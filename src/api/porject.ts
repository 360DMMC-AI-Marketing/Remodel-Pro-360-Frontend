import api from '@/api/interceptor'
import { type ProjectForm  } from '@/schemas/project'

export const createProject = async (data: ProjectForm) => {
  try {
    const formData = new FormData();
    
    // Add text fields
    formData.append('title', data.title);
    formData.append('roomType', data.roomType);
    if (data.description) {
      formData.append('description', data.description);
    }
    
    // Handle address - backend expects JSON string with coordinates
    if (data.address) {
      formData.append('address', JSON.stringify({
        street: data.address.street,
        city: data.address.city,
        state: data.address.state,
        zipCode: data.address.zipCode,
        coordinates: { type: 'Point', coordinates: [0, 0] } // Default coordinates, should be geocoded
      }));
    }
    
    // Handle budget - backend expects { min: number, max: number }
    // const budgetValue = data.customBudget 
    //   ? data.customBudget 
    //   : data.budgetRange 
    //     ? (data.budgetRange.min + data.budgetRange.max) / 2  // Use midpoint of range
    //     : 0;
    
    // formData.append('budgetRange', JSON.stringify({
    //   min: budgetValue,
    //   max: budgetValue
    // }));

    if (data.budgetRange) {
      formData.append('budgetRange', JSON.stringify({
        min: data.budgetRange.min,
        max: data.budgetRange.max
      }));
    }
    if (data.customBudget) {
      formData.append('customBudget', data.customBudget.toString());
    }
    
    // Add image files
    if (data.images && data.images.length > 0) {
      data.images.forEach((img) => {
        formData.append('images', img.file);
      });
    }
    
    const response = await api.post('/projects', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
};

export const getProjects = async () => {
  try {
    const response = await api.get('/projects');
    return response.data;
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw error;
  };
};

export const getProjectById = async (projectId: string) => {
  try {
    const response = await api.get(`/projects/${projectId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching project:', error);
    throw error;
    };
};

export const updateProject = async (projectId: string, data: ProjectForm) => {
  try {
    const response = await api.put(`/projects/${projectId}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  };
};

export const deleteProject = async (projectId: string) => {
  try {
    const response = await api.delete(`/projects/${projectId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  };
};